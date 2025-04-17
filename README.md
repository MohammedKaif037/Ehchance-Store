# VibeCart 

![Mood Picker Store](https://placeholder.svg?height=300&width=600&text=Mood+Picker+Store)

A mood-based e-commerce platform that recommends products tailored to how you're feeling. This innovative shopping experience uses mood detection, quizzes, and user preferences to create a personalized shopping journey.

## 🌟 Features

### Core Features
- **Mood Detection**: AI-powered mood detection through facial expressions
- **Mood Quiz**: Interactive quiz to determine your current mood
- **Personalized Recommendations**: Product suggestions based on your mood
- **User Accounts**: User registration, login, and profile management
- **Shopping Cart**: Add, remove, and update items in your cart
- **Checkout Process**: Secure and streamlined checkout experience
- **Order Management**: View and track your orders
- **Invoice Generation**: Generate and download invoices or receive them via email

### Advanced Features
- **Mood Analytics**: Track your mood patterns over time
- **Product Reviews**: Leave and view product reviews
- **Emoji Reactions**: React to products with emojis
- **Mood Music Player**: Listen to music that matches your mood
- **3D/AR Product Viewing**: View products in 3D or AR
- **Multiple Product Images**: View products from different angles
- **Related Products**: Discover products similar to ones you're viewing
- **Wishlist**: Save products for later
- **Subscription Service**: Subscribe to receive mood-based products regularly

## 🛠️ Technologies Used

### Frontend
- Next.js 13+ (App Router)
- React 18+
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Framer Motion for animations
- Zustand for state management

### Backend
- Supabase for authentication, database, and storage
- Next.js API routes
- Serverless functions

### Other Tools
- PDFKit for invoice generation
- Nodemailer for email sending
- Lucide React for icons

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- Supabase account
- SMTP server for email functionality

## 🚀 Getting Started

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_SECURE=true_or_false
SMTP_USER=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_FROM=your_from_email
\`\`\`

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/mood-picker-store.git
   cd mood-picker-store
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   # or
   pnpm install
   \`\`\`

3. Set up the database:
   - Create a new Supabase project
   - Run the database schema migrations (see Database Setup section)

4. Start the development server:
   \`\`\`bash
   npm run dev
   # or
   pnpm dev
   \`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Database Setup

The application uses Supabase as its database. Here's a simplified schema:

- **profiles**: User profiles with mood preferences
- **products**: Product information including mood associations
- **cart_items**: Items in user carts
- **orders**: User orders
- **order_items**: Items within orders
- **product_reviews**: User reviews for products
- **product_reactions**: Emoji reactions to products
- **user_reactions**: User-specific reactions
- **helpful_reviews**: Tracks which reviews users found helpful
- **user_favorites**: User wishlist items

To set up the database, you can use the Supabase web interface or SQL migrations.

## 📁 Project Structure

\`\`\`
mood-picker-store/
├── app/                    # Next.js App Router pages
│   ├── api/                # API routes
│   ├── account/            # User account page
│   ├── analytics/          # Mood analytics page
│   ├── cart/               # Shopping cart page
│   ├── checkout/           # Checkout page
│   ├── login/              # Authentication page
│   ├── mood-quiz/          # Mood quiz page
│   ├── orders/             # Order management pages
│   ├── products/           # Product listing and detail pages
│   ├── subscription/       # Subscription management page
│   ├── wishlist/           # User wishlist page
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Homepage
├── components/             # Reusable React components
│   ├── ui/                 # UI components (shadcn)
│   ├── header.tsx          # Site header
│   ├── mood-camera.tsx     # Mood detection camera
│   ├── mood-quiz.tsx       # Mood quiz component
│   ├── product-card.tsx    # Product display card
│   └── ...                 # Other components
├── lib/                    # Utility functions and types
│   ├── database.types.ts   # Supabase database types
│   ├── stores/             # Zustand stores
│   ├── supabase-server.ts  # Server-side Supabase client
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
├── supabase/               # Supabase edge functions
│   └── functions/          # Serverless functions
├── .env.local              # Environment variables (not in repo)
├── next.config.mjs         # Next.js configuration
├── package.json            # Project dependencies
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
\`\`\`

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login`: User login
- `POST /api/auth/register`: User registration

### Products
- `GET /api/products`: Get all products
- `GET /api/products/:id`: Get product details

### Cart
- `GET /api/cart`: Get user's cart
- `POST /api/cart`: Add item to cart
- `PUT /api/cart/:id`: Update cart item
- `DELETE /api/cart/:id`: Remove item from cart

### Orders
- `GET /api/orders`: Get user's orders
- `GET /api/orders/:id`: Get order details
- `POST /api/orders`: Create new order

### Invoices
- `GET /api/download-invoice`: Download invoice as PDF
- `POST /api/generate-invoice`: Generate and email invoice

### Mood Detection
- `POST /api/detect-mood`: Detect mood from image

## 🧠 Mood Detection

The application uses a combination of methods to detect user moods:

1. **Camera-based Detection**: Uses computer vision to analyze facial expressions
2. **Mood Quiz**: A series of questions to determine the user's current mood
3. **Manual Selection**: Users can manually select their mood

Detected moods include: Happy, Tired, Energetic, Chill, Focused, Celebrating, and more.

## 🛒 Shopping Experience

The shopping experience is tailored to the user's mood:

1. **Mood Detection**: The app determines the user's current mood
2. **Product Filtering**: Products are filtered based on the detected mood
3. **Recommendations**: The app recommends products that enhance or complement the user's mood
4. **Checkout**: A streamlined checkout process with multiple payment options
5. **Order Tracking**: Users can track their orders and view order history

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🔒 Security

- Authentication via Supabase Auth
- Secure payment processing
- Protected API routes
- Data validation and sanitization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

If you have any questions or feedback, please reach out to us at:
- Email: contact@moodpickerstore.com
- Twitter: [@MoodPickerStore](https://twitter.com/MoodPickerStore)

---

Made with ❤️ by Mohammed Kaif 
