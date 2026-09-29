/**
 * Seed script — inserts all static data into MongoDB.
 * Run with: node scripts/seed.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { connect, dbCollection } = require('../mongodbConnect/mongodbConnect');

const destinations = [
  { id: 1, title: 'Santorini', country: 'Greece', rating: 4.8, reviews: 178, price: 1299, category: 'Beach', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80', badge: 'Trending' },
  { id: 2, title: 'Bali', country: 'Indonesia', rating: 4.7, reviews: 240, price: 899, category: 'Adventure', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80', badge: 'Most Popular' },
  { id: 3, title: 'Paris', country: 'France', rating: 4.9, reviews: 310, price: 1099, category: 'Cultural', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80', badge: 'Best Seller' },
  { id: 4, title: 'Kyoto', country: 'Japan', rating: 4.7, reviews: 195, price: 1199, category: 'Cultural', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80' },
  { id: 5, title: 'New York', country: 'USA', rating: 4.6, reviews: 420, price: 1399, category: 'City', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80' },
  { id: 6, title: 'Bora Bora', country: 'French Polynesia', rating: 4.9, reviews: 89, price: 2499, category: 'Beach', image: 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?auto=format&fit=crop&w=800&q=80', badge: 'Luxury' },
  { id: 7, title: 'Tokyo', country: 'Japan', rating: 4.8, reviews: 312, price: 1399, category: 'City', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80', badge: 'Trending' },
];

const packages = [
  { id: 1, badge: 'Most Popular', badgeColor: 'bg-teal-700 text-white', title: 'Bali Adventure', duration: '7 Days / 6 Nights', location: 'Bali, Indonesia', description: 'Beach, temples, culture and adventure in one perfect trip.', price: 899, rating: 4.8, reviews: 124, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80' },
  { id: 2, badge: 'Best Seller', badgeColor: 'bg-amber-600 text-white', title: 'Paris Getaway', duration: '5 Days / 4 Nights', location: 'Paris, France', description: 'Romantic streets, iconic landmarks and world-class cuisine.', price: 1299, rating: 4.9, reviews: 210, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80' },
  { id: 3, badge: 'Trending', badgeColor: 'bg-emerald-600 text-white', title: 'Santorini Escape', duration: '6 Days / 5 Nights', location: 'Santorini, Greece', description: 'Crystal waters, stunning sunsets and charming cliffside villages.', price: 1499, rating: 4.9, reviews: 178, image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80' },
  { id: 4, badge: 'Luxury', badgeColor: 'bg-slate-800 text-white', title: 'Swiss Alps Experience', duration: '8 Days / 7 Nights', location: 'Switzerland', description: 'Majestic mountains, scenic train rides and pure tranquility.', price: 2199, rating: 4.8, reviews: 96, image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80' },
  { id: 5, badge: 'Adventure', badgeColor: 'bg-orange-600 text-white', title: 'Amazon Rainforest Trek', duration: '9 Days / 8 Nights', location: 'Brazil', description: 'Deep jungle exploration with expert naturalist guides.', price: 1799, rating: 4.7, reviews: 65, image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=800&q=80' },
  { id: 6, badge: 'Beach', badgeColor: 'bg-cyan-600 text-white', title: 'Maldives Serenity', duration: '6 Days / 5 Nights', location: 'Maldives', description: 'Overwater bungalows, crystal lagoons and vibrant coral reefs.', price: 2499, rating: 5.0, reviews: 142, image: 'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=800&q=80' },
  { id: 7, badge: 'Cultural', badgeColor: 'bg-violet-600 text-white', title: 'Kyoto Heritage Tour', duration: '7 Days / 6 Nights', location: 'Kyoto, Japan', description: 'Temples, tea ceremonies and cherry blossoms await.', price: 1399, rating: 4.8, reviews: 188, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80' },
  { id: 8, badge: 'Wildlife', badgeColor: 'bg-yellow-600 text-white', title: 'Serengeti Safari', duration: '8 Days / 7 Nights', location: 'Tanzania', description: 'Witness the great migration and Africa big five up close.', price: 2899, rating: 4.9, reviews: 73, image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=800&q=80' },
  { id: 9, badge: 'New', badgeColor: 'bg-rose-600 text-white', title: 'Iceland Northern Lights', duration: '5 Days / 4 Nights', location: 'Iceland', description: 'Chase the aurora borealis across volcanic landscapes.', price: 1899, rating: 4.7, reviews: 51, image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=800&q=80' },
  { id: 10, badge: 'Honeymoon', badgeColor: 'bg-pink-600 text-white', title: 'Bora Bora Romance', duration: '7 Days / 6 Nights', location: 'Bora Bora, French Polynesia', description: 'Overwater villas, turquoise lagoons and sunset cruises.', price: 3299, rating: 5.0, reviews: 88, image: 'https://images.unsplash.com/photo-1589197331516-4d84b72ebde3?auto=format&fit=crop&w=800&q=80' },
];

const blogs = [
  {
    id: 1,
    date: 'May 12, 2025',
    readTime: '5 min read',
    title: '10 Most Beautiful Places to Visit in 2025',
    excerpt: 'From hidden beaches to majestic mountains, these are the top destinations for your next adventure.',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=700&q=80',
    content: 'Traveling opens the mind and fills the soul. In 2025, the world is more accessible than ever. Whether you dream of pristine beaches, towering mountain peaks, or vibrant city lights, this year offers incredible travel opportunities. Top picks include: the turquoise waters of Santorini, the lush rice terraces of Bali, the romantic boulevards of Paris, the ancient temples of Kyoto, the surreal salt flats of Bolivia, the glaciers of Patagonia, and the aurora-lit skies of Iceland. Pack your bags and start exploring!',
    author: 'Wanderly Editorial',
    category: 'Travel Tips',
  },
  {
    id: 2,
    date: 'Apr 28, 2025',
    readTime: '4 min read',
    title: 'Traveling on a Budget: 10 Smart Tips',
    excerpt: 'Explore the world without breaking the bank. Here are our top budget travel tips for 2025.',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=700&q=80',
    content: 'Budget travel is an art. The secret is to plan ahead, book flights on off-peak days, use local transport, stay in boutique hostels or budget hotels, eat where locals eat, take free walking tours, and always get travel insurance. With a little creativity, you can see the world for less than you imagine.',
    author: 'Wanderly Editorial',
    category: 'Budget Travel',
  },
  {
    id: 3,
    date: 'Apr 15, 2025',
    readTime: '6 min read',
    title: 'The Ultimate Guide to Island Hopping in Indonesia',
    excerpt: 'Discover the best islands, what to do, and how to get around seamlessly.',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80',
    content: 'Indonesia is an archipelago of over 17,000 islands. Island hopping here means endless discovery. Start in Bali, move to the Gili Islands for crystal-clear water and no motorized vehicles, continue to Lombok for majestic Mt. Rinjani, then explore the Komodo Islands and encounter the legendary Komodo dragon. Use fast boats, ferries, and local flights to connect the islands efficiently. The best time to visit is April to October.',
    author: 'Wanderly Editorial',
    category: 'Destinations',
  },
  {
    id: 4,
    date: 'Mar 30, 2025',
    readTime: '5 min read',
    title: "Solo Travel: Why It's the Best Decision You'll Ever Make",
    excerpt: "More freedom. More self-discovery. Here's why solo travel can completely change your life.",
    image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=700&q=80',
    content: 'Solo travel is transformative. You set your own schedule, follow your curiosity, and meet people you never would have otherwise. It builds confidence, resilience, and self-awareness. Whether you choose a tranquil beach in Thailand or a bustling market in Marrakech, every solo journey teaches you something new about yourself and the world. Start small, stay safe, and embrace the adventure.',
    author: 'Wanderly Editorial',
    category: 'Solo Travel',
  },
];

const testimonials = [
  { id: 1, name: 'Emily Carter', location: 'California, USA', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', rating: 5, quote: 'Wanderly made our Bali trip absolutely magical! Everything was perfectly planned, from flights to hotels. The team was super helpful and responsive.' },
  { id: 2, name: 'James Miller', location: 'London, UK', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', rating: 5, quote: 'The Swiss Alps trip was a dream come true! The views were breathtaking and the itinerary was well-balanced. Highly recommend Wanderly!' },
  { id: 3, name: 'Priya Sharma', location: 'Toronto, Canada', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', rating: 5, quote: 'Excellent service, great experiences and amazing guides. Our family vacation to Santorini was unforgettable!' },
];

const gallery = [
  { id: 1, title: 'Venice Canals, Italy', image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=800&q=80' },
  { id: 2, title: 'Sahara Golden Dunes', image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80' },
  { id: 3, title: 'Cappadocia Balloon Flight', image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80' },
  { id: 4, title: 'Colosseum, Rome', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80' },
  { id: 5, title: 'Swiss Alpine Heights', image: 'https://images.unsplash.com/photo-1491557345352-5929e343eb89?auto=format&fit=crop&w=800&q=80' },
];

const categories = [
  { id: 1, name: 'Beach', subtitle: 'Getaways', icon: 'Palmtree' },
  { id: 2, name: 'Mountain', subtitle: 'Adventures', icon: 'Mountain' },
  { id: 3, name: 'City', subtitle: 'Breaks', icon: 'Building2' },
  { id: 4, name: 'Cultural', subtitle: 'Tours', icon: 'Landmark' },
  { id: 5, name: 'Wildlife', subtitle: 'Safari', icon: 'PawPrint' },
  { id: 6, name: 'Adventure', subtitle: 'Sports', icon: 'Compass' },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await connect();

    // --- Destinations ---
    const destinationsCol = dbCollection('destinations');
    await destinationsCol.deleteMany({});
    const destResult = await destinationsCol.insertMany(destinations);
    console.log(`✅ Inserted ${destResult.insertedCount} destinations`);

    // --- Packages ---
    const packagesCol = dbCollection('packages');
    await packagesCol.deleteMany({});
    const pkgResult = await packagesCol.insertMany(packages);
    console.log(`✅ Inserted ${pkgResult.insertedCount} packages`);

    // --- Blogs ---
    const blogsCol = dbCollection('blogs');
    await blogsCol.deleteMany({});
    const blogsResult = await blogsCol.insertMany(blogs);
    console.log(`✅ Inserted ${blogsResult.insertedCount} blogs`);

    // --- Testimonials ---
    const testimonialsCol = dbCollection('testimonials');
    await testimonialsCol.deleteMany({});
    const testimonialsResult = await testimonialsCol.insertMany(testimonials);
    console.log(`✅ Inserted ${testimonialsResult.insertedCount} testimonials`);

    // --- Gallery ---
    const galleryCol = dbCollection('gallery');
    await galleryCol.deleteMany({});
    const galleryResult = await galleryCol.insertMany(gallery);
    console.log(`✅ Inserted ${galleryResult.insertedCount} gallery photos`);

    // --- Categories ---
    const categoriesCol = dbCollection('categories');
    await categoriesCol.deleteMany({});
    const categoriesResult = await categoriesCol.insertMany(categories);
    console.log(`✅ Inserted ${categoriesResult.insertedCount} categories`);

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
