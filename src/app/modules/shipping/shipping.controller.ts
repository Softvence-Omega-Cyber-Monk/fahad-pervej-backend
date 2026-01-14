import { Request, Response } from 'express';
import { calculateAramexShippingRate } from './aramexShipping.service';
import { ProductModel } from '../products/product.model';

// Group cart items by vendor
const groupItemsByVendor = async (cartItems: any[]) => {
  const vendorGroups: { [vendorId: string]: { vendor: any; items: any[] } } = {};
  
  for (const item of cartItems) {
    // FLEXIBLE: Accept both 'id' and 'productId' fields
    const productId = item.productId || item.id;
    
    if (!productId) {
      throw new Error('Product ID is required in cart items');
    }
    
    const product = await ProductModel.findById(productId).populate('userId');
    
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }
    
    if (!product.userId) {
      throw new Error(`Product has no associated vendor: ${productId}`);
    }
    
    const vendor = product.userId as any;
    const vendorId = vendor._id.toString();
    
    if (!vendorGroups[vendorId]) {
      vendorGroups[vendorId] = {
        vendor: {
          id: vendorId,
          name: vendor.name || vendor.email,
          originAddress: vendor.originAddress
        },
        items: []
      };
    }
    
    vendorGroups[vendorId].items.push({
      ...item,
      productId,
      product: {
        id: product._id,
        name: product.productName
      }
    });
  }
  
  return Object.values(vendorGroups);
};

export const calculateShippingRate = async (req: Request, res: Response) => {
  try {
    const { cartItems, destinationCity, destinationCountry, destinationAddress, destinationPostCode } = req.body;

    // Validation
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart items are required'
      });
    }

    if (!destinationCountry) {
      return res.status(400).json({
        success: false,
        error: 'Destination country is required'
      });
    }

    if (!destinationCity) {
      return res.status(400).json({
        success: false,
        error: 'Destination city is required'
      });
    }

    if (!destinationAddress) {
      return res.status(400).json({
        success: false,
        error: 'Destination address is required'
      });
    }

    if (!destinationPostCode) {
      return res.status(400).json({
        success: false,
        error: 'Destination postal code is required'
      });
    }

    // Validate cart items structure
    const isValid = cartItems.every((item: any) => 
      typeof item.weight === 'number' &&
      typeof item.length === 'number' &&
      typeof item.width === 'number' &&
      typeof item.height === 'number' &&
      (item.id || item.productId) // FLEXIBLE: Accept either field
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cart item structure. Each item must have weight, length, width, height, and id/productId'
      });
    }

    // Group items by vendor
    const vendorGroups = await groupItemsByVendor(cartItems);
    
    console.log(`📦 Processing shipping for ${vendorGroups.length} vendor(s)`);
    
    // Calculate shipping for each vendor
    const shippingRates = await Promise.all(
      vendorGroups.map(async (group) => {
        const { vendor, items } = group;
        
        console.log(`📍 Calculating shipping for vendor: ${vendor.name}`);
        console.log(`📦 Items count: ${items.length}`);
        console.log(`🏠 Origin address:`, vendor.originAddress);
        
        if (!vendor.originAddress) {
          console.warn(`⚠️ Vendor ${vendor.name} has no origin address. Skipping.`);
          return null;
        }
        
        try {
          const rate = await calculateAramexShippingRate({
            cartItems: items.map((item: any) => ({
              weight: item.weight,
              length: item.length,
              width: item.width,
              height: item.height
            })),
            destinationCity,
            destinationCountry,
            destinationAddress,
            destinationPostCode,
            originAddress: vendor.originAddress
          });
          
          return {
            ...rate,
            vendorId: vendor.id,
            vendorName: vendor.name,
            itemCount: items.length
          };
        } catch (error) {
          console.error(`❌ Failed to calculate shipping for vendor ${vendor.name}:`, error);
          return null;
        }
      })
    );
    
    // Filter out null results (vendors without origin address or failed calculations)
    const validRates = shippingRates.filter(rate => rate !== null);
    
    if (validRates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid shipping rates could be calculated. Vendors may be missing origin addresses.'
      });
    }
    
    // Calculate total shipping cost
    const totalShippingCost = validRates.reduce((sum, rate) => sum + rate.price, 0);
    
    res.json({
      success: true,
      data: {
        vendors: validRates,
        totalShippingCost,
        currency: validRates[0].currency,
        vendorCount: validRates.length
      }
    });

  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
};