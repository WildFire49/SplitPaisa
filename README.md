# SplitRupee - Expense Sharing App

SplitRupee is a beautiful expense sharing application built with Next.js that helps you manage and settle expenses among friends. It's perfect for trips, roommates, or any group that needs to track shared expenses.

![SplitRupee App](https://via.placeholder.com/800x400?text=SplitRupee+App)

## Features

- **Trip Management**: Create and manage trips with your friends
- **Expense Tracking**: Add expenses and split them among participants
- **Smart Settlements**: Automatically calculates the optimal way to settle debts
- **Beautiful UI**: Modern interface with animations and responsive design
- **Database Storage**: All data is stored in Supabase for persistence

## Getting Started

### Prerequisites

1. Create a Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new Supabase project
3. Get your Supabase URL and anon key from the project settings

### Database Setup

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of the `setup-database.sql` file in this project
3. Run the SQL to create all the necessary tables

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Running the App

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## How to Use

### Creating a Trip

1. Click on "Create New Trip" on the homepage or navigate to the "Add Trip" page
2. Fill in the trip details (name, description, date)
3. Add friends who will be part of this trip
4. Submit the form to create your trip

### Adding Expenses

1. Navigate to a trip and click "Add Expense" or go to the "Add Expense" page
2. Enter the expense details:
   - Description
   - Amount (in ₹)
   - Who paid
   - Split between which friends
   - Date
3. Submit the form to add the expense

### Viewing Settlements

1. Go to the "Dashboard" page to see a summary of all balances
2. The app will show who owes whom and the optimal way to settle all debts

### Sharing a Trip

1. Navigate to a trip's details page
2. Click the "Share Trip" button to copy the URL
3. Share the URL with your friends so they can view and add expenses to the trip

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **State Management**: React Context API
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Storage**: Supabase

## Customization

You can customize the app by modifying the following files:

- `src/app/globals.css`: Update the color scheme and styling variables
- `src/store/expenseStore.js`: Modify the initial friends list or add more functionality
- `src/components/ui/`: Customize UI components

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgements

- Built with [Next.js](https://nextjs.org)
- Inspired by [Splitwise](https://www.splitwise.com/)
