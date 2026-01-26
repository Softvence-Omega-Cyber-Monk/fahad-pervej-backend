// src/controllers/cms.controller.ts
import { Request, Response } from 'express';
import { Topbar, Hero, Footer } from './cms.model';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

// ========== TOPBAR CONTROLLERS ==========
export const getTopbar = async (req: Request, res: Response) => {
  try {
    let topbar = await Topbar.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!topbar) {
      topbar = await Topbar.create({
        backgroundColor: '#000000',
        textColor: '#FFFFFF',
        content: 'Welcome to MDItems',
        isActive: true,
      });
    }

    res.status(200).json({
      success: true,
      data: topbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateTopbar = async (req: Request, res: Response) => {
  try {
    const { backgroundColor, textColor, content } = req.body;

    if (!backgroundColor || !textColor || !content) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: backgroundColor, textColor, content',
      });
    }

    let topbar = await Topbar.findOne({ isActive: true });

    if (topbar) {
      topbar.backgroundColor = backgroundColor;
      topbar.textColor = textColor;
      topbar.content = content;
      await topbar.save();
    } else {
      topbar = await Topbar.create({
        backgroundColor,
        textColor,
        content,
        isActive: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Topbar updated successfully',
      data: topbar,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating topbar',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ========== HERO CONTROLLERS ==========
export const getAllHeroes = async (req: Request, res: Response) => {
  try {
    const heroes = await Hero.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: heroes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero sections',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const getHeroById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const hero = await Hero.findById(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero section not found',
      });
    }

    res.status(200).json({
      success: true,
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const createHero = async (req: Request, res: Response) => {
  try {
    const { title, description, buttonText, buttonLink, overlayOpacity, order } = req.body;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'Hero image is required',
      });
    }

    const imageUrl = await uploadToCloudinary(imageFile.path, 'cms/hero');

    const hero = await Hero.create({
      title: title || '',
      description: description || '',
      image: imageUrl,
      buttonText: buttonText || 'Start Shopping Now',
      buttonLink: buttonLink || '/shop',
      overlayOpacity: overlayOpacity !== undefined ? parseFloat(overlayOpacity) : 0.6,
      order: order !== undefined ? parseInt(order) : 0,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Hero section created successfully',
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateHero = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, buttonText, buttonLink, overlayOpacity, order } = req.body;
    const imageFile = req.file;

    const hero = await Hero.findById(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero section not found',
      });
    }

    let imageUrl = hero.image;
    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile.path, 'cms/hero');
    }

    hero.title = title !== undefined ? title : hero.title;
    hero.description = description !== undefined ? description : hero.description;
    hero.image = imageUrl;
    hero.buttonText = buttonText !== undefined ? buttonText : hero.buttonText;
    hero.buttonLink = buttonLink !== undefined ? buttonLink : hero.buttonLink;
    hero.overlayOpacity = overlayOpacity !== undefined ? parseFloat(overlayOpacity) : hero.overlayOpacity;
    hero.order = order !== undefined ? parseInt(order) : hero.order;
    await hero.save();

    res.status(200).json({
      success: true,
      message: 'Hero section updated successfully',
      data: hero,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const deleteHero = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const hero = await Hero.findByIdAndDelete(id);

    if (!hero) {
      return res.status(404).json({
        success: false,
        message: 'Hero section not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Hero section deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting hero section',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ========== FOOTER CONTROLLERS ==========
export const getFooter = async (req: Request, res: Response) => {
  try {
    let footer = await Footer.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    if (!footer) {
      footer = await Footer.create({
        logo: 'https://via.placeholder.com/150x50',
        description: 'Your trusted online shopping destination',
        address: '123 Main Street, City, Country',
        email: 'info@mditems.com',
        phone: '+1 234 567 8900',
        socialLinks: {},
        copyright: '© 2024 MDItems. All rights reserved.',
        privacyPolicy: 'Add your privacy policy here',
        cookiePolicy: 'Add your cookie policy here',
        shippingPolicy: 'Add your shipping policy here',
        refundPolicy: 'Add your refund policy here',
        buyerProtection: 'Add your buyer protection policy here',
        sellerProtection: 'Add your seller protection policy here',
        isActive: true,
      });
    }

    res.status(200).json({
      success: true,
      data: footer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const updateFooter = async (req: Request, res: Response) => {
  try {
    const { 
      description, 
      address, 
      email, 
      phone, 
      socialLinks, 
      copyright, 
      privacyPolicy, 
      cookiePolicy,
      shippingPolicy, 
      refundPolicy,
      buyerProtection,
      sellerProtection
    } = req.body;
    const logoFile = req.file;

    if (!description || !address || !email || !phone || !copyright || 
        !privacyPolicy || !cookiePolicy || !shippingPolicy || !refundPolicy ||
        !buyerProtection || !sellerProtection) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: description, address, email, phone, copyright, privacyPolicy, cookiePolicy, shippingPolicy, refundPolicy, buyerProtection, sellerProtection',
      });
    }

    let footer = await Footer.findOne({ isActive: true });

    let logoUrl = footer?.logo || 'https://via.placeholder.com/150x50';
    if (logoFile) {
      logoUrl = await uploadToCloudinary(logoFile.path, 'cms/footer');
    }

    if (footer) {
      footer.logo = logoUrl;
      footer.description = description;
      footer.address = address;
      footer.email = email;
      footer.phone = phone;
      footer.socialLinks = socialLinks ? JSON.parse(socialLinks) : footer.socialLinks;
      footer.copyright = copyright;
      footer.privacyPolicy = privacyPolicy;
      footer.cookiePolicy = cookiePolicy;
      footer.shippingPolicy = shippingPolicy;
      footer.refundPolicy = refundPolicy;
      footer.buyerProtection = buyerProtection;
      footer.sellerProtection = sellerProtection;
      await footer.save();
    } else {
      footer = await Footer.create({
        logo: logoUrl,
        description,
        address,
        email,
        phone,
        socialLinks: socialLinks ? JSON.parse(socialLinks) : {},
        copyright,
        privacyPolicy,
        cookiePolicy,
        shippingPolicy,
        refundPolicy,
        buyerProtection,
        sellerProtection,
        isActive: true,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Footer updated successfully',
      data: footer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating footer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};