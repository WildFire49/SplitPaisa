'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import Card from '@/components/ui/Card';

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpenseCategoryChart = ({ expenses }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: [],
        borderColor: [],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (!expenses || expenses.length === 0) return;

    // Group expenses by category
    const expensesByCategory = {};
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      expensesByCategory[category] = (expensesByCategory[category] || 0) + parseFloat(expense.amount);
    });

    // Sort categories by amount
    const sortedCategories = Object.entries(expensesByCategory)
      .sort((a, b) => b[1] - a[1]);

    const categoryNames = sortedCategories.map(([name]) => name);
    const amounts = sortedCategories.map(([_, amount]) => amount);

    // Generate colors
    const backgroundColors = [
      'rgba(16, 185, 129, 0.8)',   // secondary
      'rgba(245, 158, 11, 0.8)',   // tertiary
      'rgba(99, 102, 241, 0.8)',   // primary
      'rgba(239, 68, 68, 0.8)',    // red
      'rgba(59, 130, 246, 0.8)',   // blue
      'rgba(168, 85, 247, 0.8)',   // purple
      'rgba(236, 72, 153, 0.8)',   // pink
      'rgba(234, 179, 8, 0.8)',    // yellow
    ];

    const borderColors = [
      'rgba(5, 150, 105, 1)',      // secondary-dark
      'rgba(217, 119, 6, 1)',      // tertiary-dark
      'rgba(79, 70, 229, 1)',      // primary-dark
      'rgba(220, 38, 38, 1)',      // red-dark
      'rgba(37, 99, 235, 1)',      // blue-dark
      'rgba(147, 51, 234, 1)',     // purple-dark
      'rgba(219, 39, 119, 1)',     // pink-dark
      'rgba(202, 138, 4, 1)',      // yellow-dark
    ];

    // Generate chart data
    setChartData({
      labels: categoryNames,
      datasets: [
        {
          data: amounts,
          backgroundColor: backgroundColors.slice(0, categoryNames.length),
          borderColor: borderColors.slice(0, categoryNames.length),
          borderWidth: 1,
        },
      ],
    });
  }, [expenses]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            family: "'Onest', sans-serif",
            size: 12
          },
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ₹${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    },
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Expense Categories</h3>
        <p className="text-gray-500">No expenses to display</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Expense Categories</h3>
      <div className="h-64 relative">
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ExpenseCategoryChart;
