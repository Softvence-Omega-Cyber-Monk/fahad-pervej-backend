// src/controllers/cms.controller.ts
import { Request, Response } from 'express';
import { Topbar, Hero, Footer } from './cms.model';
import { uploadToCloudinary } from '../../../utils/cloudinaryUpload';

// ========== TOPBAR CONTROLLERS ==========
export const getTopbar = async (req: Request, res: Response) => {
  try {
    let topbar = await Topbar.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no topbar exists, create a default one
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

    // Validation
    if (!backgroundColor || !textColor || !content) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: backgroundColor, textColor, content',
      });
    }

    // Find the active topbar and update it, or create if none exists
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
export const getHero = async (req: Request, res: Response) => {
  try {
    let hero = await Hero.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no hero exists, create a default one
    if (!hero) {
      hero = await Hero.create({
        title: 'Welcome to MDItems',
        description: 'Your one-stop shop for quality products',
        image: 'https://via.placeholder.com/1920x600',
        buttonText: 'Start Shopping Now',
        buttonLink: '/shop',
        overlayOpacity: 0.6,
        isActive: true,
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

export const updateHero = async (req: Request, res: Response) => {
  try {
    const { title, description, buttonText, buttonLink, overlayOpacity } = req.body;
    const imageFile = req.file;

    // Validation
    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Required fields: title, description',
      });
    }

    // Find the active hero
    let hero = await Hero.findOne({ isActive: true });

    // Upload new image if provided
    let imageUrl = hero?.image || 'https://via.placeholder.com/1920x600';
    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile.path, 'cms/hero');
    }

    if (hero) {
      hero.title = title;
      hero.description = description;
      hero.image = imageUrl;
      hero.buttonText = buttonText || hero.buttonText;
      hero.buttonLink = buttonLink || hero.buttonLink;
      hero.overlayOpacity = overlayOpacity !== undefined ? parseFloat(overlayOpacity) : hero.overlayOpacity;
      await hero.save();
    } else {
      hero = await Hero.create({
        title,
        description,
        image: imageUrl,
        buttonText: buttonText || 'Start Shopping Now',
        buttonLink: buttonLink || '/shop',
        overlayOpacity: overlayOpacity !== undefined ? parseFloat(overlayOpacity) : 0.6,
        isActive: true,
      });
    }

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

// ========== FOOTER CONTROLLERS ==========
export const getFooter = async (req: Request, res: Response) => {
  try {
    let footer = await Footer.findOne({ isActive: true }).sort({ createdAt: -1 });
    
    // If no footer exists, create a default one
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
        shippingPolicy: 'Add your shipping policy here',
        refundPolicy: 'Add your refund policy here',
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
    const { description, address, email, phone, socialLinks, copyright, privacyPolicy, shippingPolicy, refundPolicy } = req.body;
    const logoFile = req.file;

    // Validation
    if (!description || !address || !email || !phone || !copyright || !privacyPolicy || !shippingPolicy || !refundPolicy) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: description, address, email, phone, copyright, privacyPolicy, shippingPolicy, refundPolicy',
      });
    }

    // Find the active footer
    let footer = await Footer.findOne({ isActive: true });

    // Upload new logo if provided
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
      footer.shippingPolicy = shippingPolicy;
      footer.refundPolicy = refundPolicy;
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
        shippingPolicy,
        refundPolicy,
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
}