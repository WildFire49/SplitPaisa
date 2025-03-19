import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ExpenseProvider } from '@/store/expenseStore';
import Header from '@/components/layout/Header';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SplitRupee - Split Expenses with Friends",
  description: "A beautiful app to manage and split expenses among friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ExpenseProvider>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              {children}
            </main>
            <footer className="bg-white dark:bg-gray-900 py-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
              <p>SplitRupee {new Date().getFullYear()} - Split expenses with friends</p>
            </footer>
          </div>
        </ExpenseProvider>
      </body>
    </html>
  );
}
