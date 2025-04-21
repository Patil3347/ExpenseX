
import { useEffect } from 'react';
import * as echarts from 'echarts';

export const HomeStats = () => {
  useEffect(() => {
    // Initialize category chart
    const categoryChart = echarts.init(document.getElementById("categoryChart"));
    const categoryOption = {
      animation: false,
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        textStyle: {
          color: "#1f2937",
        },
      },
      legend: {
        orient: "vertical",
        right: 10,
        top: "center",
        textStyle: {
          color: "#E0E0E0",
        },
      },
      series: [
        {
          name: "Spending",
          type: "pie",
          radius: ["40%", "70%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
              color: "#FFFFFF",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            {
              value: 35,
              name: "Food & Dining",
              itemStyle: { color: "rgba(87, 181, 231, 1)" },
            },
            {
              value: 20,
              name: "Housing",
              itemStyle: { color: "rgba(141, 211, 199, 1)" },
            },
            {
              value: 15,
              name: "Transportation",
              itemStyle: { color: "rgba(251, 191, 114, 1)" },
            },
            {
              value: 30,
              name: "Entertainment",
              itemStyle: { color: "rgba(252, 141, 98, 1)" },
            },
          ],
        },
      ],
    };
    categoryChart.setOption(categoryOption);

    // Initialize savings chart
    const savingsChart = echarts.init(document.getElementById("savingsChart"));
    const savingsOption = {
      animation: false,
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        textStyle: {
          color: "#1f2937",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "3%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        axisLine: {
          lineStyle: {
            color: "#666",
          },
        },
        axisLabel: {
          color: "#E0E0E0",
        },
      },
      yAxis: {
        type: "value",
        axisLine: {
          lineStyle: {
            color: "#666",
          },
        },
        axisLabel: {
          color: "#E0E0E0",
          formatter: "${value}",
        },
        splitLine: {
          lineStyle: {
            color: "rgba(255, 255, 255, 0.1)",
          },
        },
      },
      series: [
        {
          name: "Expenses",
          type: "line",
          stack: "Total",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "rgba(252, 141, 98, 1)",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(252, 141, 98, 0.2)",
              },
              {
                offset: 1,
                color: "rgba(252, 141, 98, 0.0)",
              },
            ]),
          },
          emphasis: {
            focus: "series",
          },
          data: [1200, 1350, 1100, 1500, 1300, 1450],
        },
        {
          name: "Savings",
          type: "line",
          stack: "Total",
          smooth: true,
          lineStyle: {
            width: 3,
            color: "rgba(87, 181, 231, 1)",
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: "rgba(87, 181, 231, 0.2)",
              },
              {
                offset: 1,
                color: "rgba(87, 181, 231, 0.0)",
              },
            ]),
          },
          emphasis: {
            focus: "series",
          },
          data: [200, 250, 300, 350, 400, 500],
        },
      ],
    };
    savingsChart.setOption(savingsOption);

    // Handle resize
    const resizeHandler = () => {
      if (categoryChart && savingsChart) {
        categoryChart.resize();
        savingsChart.resize();
      }
    };

    window.addEventListener('resize', resizeHandler);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeHandler);
      if (categoryChart) {
        categoryChart.dispose();
      }
      if (savingsChart) {
        savingsChart.dispose();
      }
    };
  }, []);

  return (
    <section className="py-20 bg-[#2D2D2D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Chart 1 */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Monthly Spending by Category
            </h3>
            <div id="categoryChart" className="w-full h-80"></div>
          </div>
          {/* Chart 2 */}
          <div className="bg-[#1A1A1A] rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-white">
              Savings Growth
            </h3>
            <div id="savingsChart" className="w-full h-80"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
