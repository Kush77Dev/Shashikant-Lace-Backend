import 'dotenv/config';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Coupon from '../models/Coupon.js';
import Testimonial from '../models/Testimonial.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shashikant_lace';

const categories = [
  { slug: 'bridal', name: 'Bridal Laces', desc: 'Exquisite hand-worked and corded lace for couture bridal wear.', count: 12, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/e23bc904e_generated_2f6c47e9.png' },
  { slug: 'embroidered', name: 'Embroidered Fabrics', desc: 'Intricate zari, threadwork, and zardozi on premium nets and silks.', count: 18, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/592967ba4_generated_79aabbe7.png' },
  { slug: 'chantilly', name: 'Chantilly & French', desc: 'Delicate French Chantilly and eyelash laces crafted in France & Italy.', count: 9, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/9cd956af3_generated_92d7e82d.png' },
  { slug: 'sequins', name: 'Sequin & Metallic', desc: 'Dazzling sequin-embellished fabrics for festive & evening ensembles.', count: 14, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/d3c1e45e9_generated_68a2121d.png' },
  { slug: 'guipure', name: 'Guipure & Cutwork', desc: 'Heavy Venetian cutwork and chemical lace for modern silhouette overlays.', count: 7, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/3f1ef0d91_generated_2aa5831f.png' }
];

const collections = [
  { slug: 'royal-bridal', name: 'Royal Bridal Atelier 2026', tagline: 'Regal ivory and gold laces curated for grand wedding couture.', count: 15, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/e23bc904e_generated_2f6c47e9.png' },
  { slug: 'festive-glamour', name: 'Festive Glamour', tagline: 'Rich zardozi, hand sequins, and vibrant jewel-toned fabrics.', count: 20, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/592967ba4_generated_79aabbe7.png' },
  { slug: 'monochrome-atelier', name: 'Monochrome Atelier', tagline: 'Dramatic black and ivory Chantilly laces for modern silhouettes.', count: 10, image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/9cd956af3_generated_92d7e82d.png' }
];

const products = [
  {
    name: 'Royal Ivory Corded Alençon Bridal Lace',
    slug: 'royal-ivory-corded-alencon-bridal-lace',
    category: 'bridal', collectionName: 'royal-bridal', type: 'Alençon Lace',
    image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/e23bc904e_generated_2f6c47e9.png',
    gallery: ['https://media.base44.com/images/public/6a67484052988d5b51f065c9/e23bc904e_generated_2f6c47e9.png'],
    price: 3450, oldPrice: 4200, color: 'Ivory & Champagne', country: 'France',
    width: '54 inches', pattern: 'Floral Scalloped Border', stretch: false,
    rating: 4.9, reviews: 24, badge: 'Best Seller', stock: 85, isNewItem: true,
    trending: true, material: 'Nylon & Rayon Cord',
    description: 'Ultra-luxurious French corded Alençon lace with scalloped borders. Perfect for bespoke wedding gowns and couture blouses.',
    vendor: 'Shashikant Atelier Paris'
  },
  {
    name: 'Midnight Black French Chantilly Eyelash Lace',
    slug: 'midnight-black-french-chantilly-eyelash-lace',
    category: 'chantilly', collectionName: 'monochrome-atelier', type: 'Chantilly',
    image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/9cd956af3_generated_92d7e82d.png',
    gallery: ['https://media.base44.com/images/public/6a67484052988d5b51f065c9/9cd956af3_generated_92d7e82d.png'],
    price: 2890, oldPrice: 3500, color: 'Jet Black', country: 'France',
    width: '52 inches', pattern: 'Eyelash Floral Grid', stretch: true,
    rating: 4.8, reviews: 19, badge: 'Trending', stock: 60, isNewItem: false,
    trending: true, material: 'Polyamide & Elastane',
    description: 'Whisper-soft Chantilly lace with delicate double eyelash finish. Ideal for evening gowns and overlay capes.',
    vendor: 'Shashikant Atelier Lyon'
  },
  {
    name: 'Golden Zardozi Embroidered Silk Organza',
    slug: 'golden-zardozi-embroidered-silk-organza',
    category: 'embroidered', collectionName: 'festive-glamour', type: 'Embroidered Organza',
    image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/592967ba4_generated_79aabbe7.png',
    gallery: ['https://media.base44.com/images/public/6a67484052988d5b51f065c9/592967ba4_generated_79aabbe7.png'],
    price: 4100, oldPrice: 4800, color: 'Antique Gold & Emerald', country: 'India',
    width: '44 inches', pattern: 'Zardozi Paisley Motifs', stretch: false,
    rating: 5.0, reviews: 31, badge: 'Limited Edition', stock: 40, isNewItem: true,
    trending: true, material: 'Pure Silk Organza & Metallic Zari',
    description: 'Handcrafted zardozi embroidery on pure silk organza. Each meter takes karigars 12 hours of wirework.',
    vendor: 'Shashikant Heritage Surat'
  },
  {
    name: 'Champagne Micro-Sequin Tulle Net',
    slug: 'champagne-micro-sequin-tulle-net',
    category: 'sequins', collectionName: 'festive-glamour', type: 'Sequin Net',
    image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/d3c1e45e9_generated_68a2121d.png',
    gallery: ['https://media.base44.com/images/public/6a67484052988d5b51f065c9/d3c1e45e9_generated_68a2121d.png'],
    price: 1950, oldPrice: 2400, color: 'Champagne Gold', country: 'Italy',
    width: '58 inches', pattern: 'Cascading Shimmer', stretch: true,
    rating: 4.7, reviews: 14, badge: 'Popular', stock: 120, isNewItem: false,
    trending: false, material: 'Polyester Tulle & 2mm Sequins',
    description: 'Dense 2mm micro-sequins stitched onto flexible soft tulle net. Catches light dramatically from every angle.',
    vendor: 'Shashikant Milan'
  },
  {
    name: 'Venetian Cutwork Heavy Guipure Lace',
    slug: 'venetian-cutwork-heavy-guipure-lace',
    category: 'guipure', collectionName: 'royal-bridal', type: 'Guipure Lace',
    image: 'https://media.base44.com/images/public/6a67484052988d5b51f065c9/3f1ef0d91_generated_2aa5831f.png',
    gallery: ['https://media.base44.com/images/public/6a67484052988d5b51f065c9/3f1ef0d91_generated_2aa5831f.png'],
    price: 3800, oldPrice: 4500, color: 'Blush Pink & Rose Gold', country: 'Italy',
    width: '50 inches', pattern: '3D Floral Cutwork', stretch: false,
    rating: 4.9, reviews: 28, badge: 'Exclusive', stock: 50, isNewItem: true,
    trending: true, material: '100% Cotton Guipure Cord',
    description: 'Heavyweight architectural Guipure lace featuring 3D cutout floral medallions. Structural yet soft against skin.',
    vendor: 'Shashikant Venice'
  }
];

const coupons = [
  { code: 'LACE10', description: '10% off your entire first order', type: 'percent', value: 10, min_order: 1500, active: true },
  { code: 'ELEGANCE15', description: '15% off orders over ₹5,000', type: 'percent', value: 15, min_order: 5000, max_discount: 2000, active: true },
  { code: 'FREESHIP', description: 'Free express shipping across India', type: 'ship', value: 0, min_order: 2000, active: true }
];

const testimonials = [
  { name: 'Sanya Malhotra', role: 'Couture Designer, Mumbai', text: 'Shashikant Lace has been our house\'s secret weapon for bridal embroidery. The French Chantilly quality is unmatched anywhere in Asia.', rating: 5 },
  { name: 'Ananya Roy', role: 'Bridal Stylist, Delhi', text: 'Finding authentic corded Alençon lace in India used to require importing directly from Europe. Shashikant Lace delivers world-class quality overnight.', rating: 5 },
  { name: 'Rohan & Natasha', role: 'Atelier Founders, Bengaluru', text: 'Prompt delivery, impeccable craftsmanship, and stunning swatches. Our brides adore the Venetian Guipure collection.', rating: 5 }
];

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Collection.deleteMany({}),
      Coupon.deleteMany({}),
      Testimonial.deleteMany({})
    ]);

    console.log('🌱 Seeding categories...');
    await Category.insertMany(categories);

    console.log('🌱 Seeding collections...');
    await Collection.insertMany(collections);

    console.log('🌱 Seeding products...');
    await Product.insertMany(products);

    console.log('🌱 Seeding coupons...');
    await Coupon.insertMany(coupons);

    console.log('🌱 Seeding testimonials...');
    await Testimonial.insertMany(testimonials);

    console.log('✅ Database seeded successfully with Base44 CDN images!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
