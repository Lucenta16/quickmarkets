# QuickMarkets v1.0.0 - MVP Release

## Overview
QuickMarkets is a desktop screensaver application that displays real-time financial market data in an elegant, card-based interface. This MVP release includes core functionality for displaying stocks, cryptocurrencies, and forex pairs with live price updates and interactive charts.

## Features

### Core Functionality
- **Real-Time Market Data**: Live updates from Yahoo Finance API with 15-second refresh for quotes and 60-second refresh for charts
- **Multi-Market Support**: Stocks, cryptocurrencies, and forex pairs in a unified interface
- **4-Hour Charts**: Detailed 4-hour charts with 5-minute intervals showing recent price movements
- **Watchlist Management**: Add/remove financial instruments from your personalized watchlist
- **Grid Layout**: Configurable grid size for optimal display on different screens

### Visual Enhancements
- **Positive/Negative Indicators**: Color-coded price changes with '+' sign for positive changes
- **Visual Data Source Indicators**: Clear distinction between real-time and fallback data
- **Responsive Charts**: Charts automatically adjust to show data only up to the current time
- **Loading States**: Component-specific loading indicators for better user experience

### Technical Features
- **Screensaver Mode**: Automatic activation with `--screensaver` flag for fullscreen kiosk mode
- **Error Handling**: Robust error handling with fallback to synthetic data when API fails
- **Adaptive Refresh**: Optimized refresh cycles to balance data freshness and performance

## Installation

1. Download the release package
2. Extract the files
3. Run `npm install` to install dependencies
4. Start the application with `npm start`
5. For screensaver mode, use `npm start -- --screensaver`

## Known Limitations

- Currently runs as an Electron app for testing; Windows screensaver (.scr) implementation planned for future release
- Settings are stored in-memory; future versions will use Windows Registry for persistent settings
- Limited to Yahoo Finance API data sources

## Upcoming Features

- Native Windows screensaver implementation
- Windows screensaver settings dialog integration
- Additional data sources and markets
- User-configurable refresh intervals and chart timeframes
- Performance optimizations for lower resource usage
