import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, type IChartApi, type ISeriesApi, type LineData, type Time, LineSeries } from 'lightweight-charts';

interface CandlestickChartProps {
    coinId: string;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ coinId }) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<LineData[]>([]);

    // Function to fetch data from CoinGecko
    const fetchData = useCallback(async () => {
        if (!coinId) return;

        // Don't set loading on refresh to avoid flickering unless it's initial load or we have no data
        if (data.length === 0) setLoading(true);
        setError(null);

        try {
            // Changed to 365 days
            const response = await fetch(
                `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc?vs_currency=usd&days=365`
            );

            if (!response.ok) {
                throw new Error('Failed to fetch price data');
            }

            const rawData = await response.json();

            if (!Array.isArray(rawData)) {
                throw new Error('Invalid data format received');
            }

            // Transform data: CoinGecko returns [timestamp_ms, open, high, low, close]
            // Map to LineData: { time, value: close }
            const formattedData: LineData[] = rawData.map((item: any) => ({
                time: Math.floor(item[0] / 1000) as Time, // timestamp in seconds
                value: item[4], // Close price
            })).filter((item: any) =>
                item.value != null
            ).sort((a: any, b: any) => (a.time as number) - (b.time as number));

            // Remove duplicates
            const uniqueData = formattedData.filter((item, index, self) =>
                index === self.findIndex((t) => (
                    t.time === item.time
                ))
            );

            setData(uniqueData);
        } catch (err: any) {
            console.error('Error fetching chart data:', err);
            setError(err.message || 'Failed to load chart data');
        } finally {
            setLoading(false);
        }
    }, [coinId]);

    // Initial fetch and polling
    useEffect(() => {
        fetchData();
        // Auto-refresh every 2 minutes
        const intervalId = setInterval(fetchData, 120000);
        return () => clearInterval(intervalId);
    }, [fetchData]);

    // Chart initialization and update
    useEffect(() => {
        if (!chartContainerRef.current || data.length === 0) return;

        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
            localization: {
                priceFormatter: (price: number) => {
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
                },
            },
            layout: {
                background: { type: ColorType.Solid, color: '#000000' }, // Black background
                textColor: '#d1d5db', // Light gray text
            },
            grid: {
                vertLines: { color: '#333333' }, // Low contrast gray
                horzLines: { color: '#333333' },
            },
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#333333',
            },
            rightPriceScale: {
                borderColor: '#333333',
                scaleMargins: { top: 0.1, bottom: 0.1 },
            },
            crosshair: {
                mode: 1, // CrosshairMode.Normal
                vertLine: {
                    width: 1,
                    color: '#333333',
                    style: 3,
                },
                horzLine: {
                    width: 1,
                    color: '#333333',
                    style: 3,
                },
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
        });

        // Add Green Line Series
        const series = chart.addSeries(LineSeries, {
            color: '#10b981', // Green-500
            lineWidth: 2,
            crosshairMarkerVisible: true,
            crosshairMarkerRadius: 4,
            crosshairMarkerBorderColor: '#000000',
            crosshairMarkerBackgroundColor: '#10b981',
            priceFormat: {
                type: 'custom',
                formatter: (price: number) => {
                    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
                }
            },
        });

        series.setData(data);

        chart.timeScale().fitContent();

        chartRef.current = chart;
        seriesRef.current = series;

        // Tooltip Logic
        const toolTip = tooltipRef.current;
        if (toolTip) {
            chart.subscribeCrosshairMove((param) => {
                if (
                    param.point === undefined ||
                    !param.time ||
                    param.point.x < 0 ||
                    param.point.x > chartContainerRef.current!.clientWidth ||
                    param.point.y < 0 ||
                    param.point.y > chartContainerRef.current!.clientHeight
                ) {
                    toolTip.style.display = 'none';
                } else {
                    toolTip.style.display = 'block';
                    const data = param.seriesData.get(series);
                    const price = data ? (data as LineData).value : undefined;

                    // Format date
                    const dateStr = new Date((param.time as number) * 1000).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                    });

                    // Format price USD
                    const priceStr = price !== undefined
                        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
                        : '';

                    toolTip.innerHTML = `
                <div class="text-gray-400 text-xs">${dateStr}</div>
                <div class="text-[#10b981] font-bold text-sm">${priceStr}</div>
            `;

                    // Position tooltip
                    const coordinate = series.priceToCoordinate(price!);
                    let shiftedCoordinate = param.point.x - 50; // Center tooltip
                    if (coordinate === null) {
                        return;
                    }

                    shiftedCoordinate = Math.max(0, Math.min(chartContainerRef.current!.clientWidth - 100, shiftedCoordinate));

                    toolTip.style.left = shiftedCoordinate + 'px';
                    toolTip.style.top = 10 + 'px';
                }
            });
        }

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({
                    width: chartContainerRef.current.clientWidth,
                    height: chartContainerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data]);

    return (
        <div className="w-full relative bg-transparent rounded-lg overflow-visible">
            <div className="mb-4">
                <h3 className="text-xl font-semibold text-white">Price Chart (USD)</h3>
            </div>

            <div
                className="w-full h-[300px] md:h-[400px] relative border border-[#8AE06C]/20 rounded-lg bg-black overflow-hidden"
            >
                <div ref={chartContainerRef} className="w-full h-full relative" />

                {/* Tooltip Element */}
                <div
                    ref={tooltipRef}
                    className="absolute z-20 bg-black/80 border border-white/10 rounded px-2 py-1 pointer-events-none hidden transition-opacity"
                    style={{ left: 0, top: 0 }}
                />

                {loading && data.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 backdrop-blur-sm">
                        <div className="text-[#10b981] animate-pulse font-mono">Loading chart data...</div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10 text-center p-4">
                        <span className="text-red-400 mb-2 font-mono">Error: {error}</span>
                        <button
                            onClick={fetchData}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandlestickChart;
