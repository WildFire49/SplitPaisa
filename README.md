# SplitRupee - Expense Sharing App

SplitRupee is a beautiful expense sharing application built with Next.js that helps you manage and settle expenses among friends. It's perfect for trips, roommates, or any group that needs to track shared expenses.

![SplitRupee App](https://via.placeholder.com/800x400?text=SplitRupee+App)

## Features

- **Trip Management**: Create and manage trips with your friends
- **Expense Tracking**: Add expenses and split them among participants
- **Smart Settlements**: Automatically calculates the optimal way to settle debts
- **Beautiful UI**: Modern interface with animations and responsive design
- **Local Storage**: All data is stored locally in your browser

## Getting Started

First, run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

## How to Use

### Creating a Trip

1. Click on "Create New Trip" on the homepage or navigate to the "Add Trip" page
2. Fill in the trip details (name, description, date)
3. Submit the form to create your trip

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
- **Storage**: Browser's localStorage

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
