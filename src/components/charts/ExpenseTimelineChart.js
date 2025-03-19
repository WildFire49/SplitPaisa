'use client';

import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Card from '@/components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ExpenseTimelineChart = ({ expenses }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Expenses Over Time',
        data: [],
        borderColor: 'rgba(99, 102, 241, 1)',
        backgroundColor: 'rgba(99, 102, 241, 0.2)',
        tension: 0.4,
      },
    ],
  });

  useEffect(() => {
    if (!expenses || expenses.length === 0) return;

    // Group expenses by date
    const expensesByDate = {};
    
    // Sort expenses by date
    const sortedExpenses = [...expenses].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );
    
    // Get the earliest and latest dates
    const earliestDate = new Date(sortedExpenses[0].created_at);
    const latestDate = new Date(sortedExpenses[sortedExpenses.length - 1].created_at);
    
    // Create an array of dates between earliest and latest
    const dateLabels = [];
    const currentDate = new Date(earliestDate);
    
    while (currentDate <= latestDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      dateLabels.push(dateString);
      expensesByDate[dateString] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculate total for each date
    sortedExpenses.forEach(expense => {
      const dateString = new Date(expense.created_at).toISOString().split('T')[0];
      expensesByDate[dateString] = (expensesByDate[dateString] || 0) + parseFloat(expense.amount);
    });
    
    // Calculate cumulative expenses
    let cumulativeAmount = 0;
    const cumulativeData = dateLabels.map(date => {
      cumulativeAmount += expensesByDate[date] || 0;
      return cumulativeAmount;
    });
    
    // Format date labels for display
    const formattedLabels = dateLabels.map(date => {
      const [year, month, day] = date.split('-');
      return `${day}/${month}`;
    });
    
    // Generate chart data
    setChartData({
      labels: formattedLabels,
      datasets: [
        {
          label: 'Cumulative Expenses',
          data: cumulativeData,
          borderColor: 'rgba(99, 102, 241, 1)',
          backgroundColor: 'rgba(99, 102, 241, 0.2)',
          fill: true,
          tension: 0.4,
        },
      ],
    });
  }, [expenses]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            family: "'Onest', sans-serif",
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Total: ₹${context.raw.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value;
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  if (!expenses || expenses.length === 0) {
    return (
      <Card className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Expense Timeline</h3>
        <p className="text-gray-500">No expenses to display</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Expense Timeline</h3>
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
};

export default ExpenseTimelineChart;
