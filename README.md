# QuickMarkets

A desktop screensaver application that displays real-time financial market data in an elegant, card-based interface. QuickMarkets functions as a financial markets screensaver/dashboard, showing stocks, cryptocurrencies, and forex pairs with live price updates and interactive charts.

![QuickMarkets Screenshot](src/assets/screenshot.png)

## Features

- **Market Cards Display**: Grid-based layout of financial instrument cards with configurable grid size
- **Multi-Market Support**: Stocks, Cryptocurrencies, and Forex pairs
- **Real-Time Data**: Configurable refresh rates (15s for quotes, 60s for charts) with Yahoo Finance API integration
- **Watchlist Management**: Add/remove instruments from personal watchlist with persistent storage
- **Interactive Charts**: Line charts with gradient backgrounds showing 4-hour historical price data with 5-minute intervals
- **Visual Indicators**: Clear visual distinction between real-time and fallback data
- **Positive/Negative Indicators**: Color-coded price changes with '+' sign for positive changes
- **Clock Display**: Real-time clock and date display integrated into the header
- **Settings Panel**: Configure refresh rate, grid size, and manage watchlist

## Tech Stack

- **Platform**: Electron (for desktop application)
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for interactive financial charts
- **Data Source**: Yahoo Finance API (simulated) with fallback synthetic data generation
- **Storage**: Electron Store for persistent settings and watchlists

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/quickmarkets.git
cd quickmarkets
```

2. Install dependencies:
```bash
npm install
```

3. Start the application:
```bash
npm start
```

## Architecture

The application is built with a modular architecture consisting of three main components:

1. **Core Application Class** (`QuickMarketsApp`):
   - Manages application state and initialization
   - Handles data fetching and update cycles
   - Controls display functionality
   - Manages settings and watchlist persistence

2. **UI Service** (`UiService`):
   - Renders market cards and updates their content
   - Manages the clock and status displays
   - Handles settings modal and user interactions
   - Creates and updates charts

3. **API Service** (`EnhancedApiService`):
   - Communicates with Yahoo Finance API (simulated)
   - Implements rate limiting protection and caching
   - Provides fallback data when API is unavailable
   - Formats data for different instrument types

## Usage

### Adding Instruments

1. Click the settings icon (⚙️) in the top-right corner
2. In the Watchlist section, enter a symbol (e.g., AAPL)
3. Select the instrument type (stock, crypto, forex)
4. Click "Add"

### Changing Display Settings

1. Click the settings icon (⚙️)
2. Adjust the refresh rate (in seconds)
3. Select your preferred grid size (small, medium, large)
4. Click "Save Settings"

### Fullscreen Mode

Click the fullscreen icon (⛶) to toggle fullscreen mode.

## Development

### Project Structure

```
quickmarkets/
├── src/
│   ├── main.js           # Electron main process
│   ├── preload.js        # Preload script for IPC
│   ├── index.html        # Main HTML file
│   ├── renderer.js       # Renderer process script
│   ├── styles/           # CSS styles
│   │   └── main.css      # Main stylesheet
│   ├── services/         # Service modules
│   └── assets/           # Images and other assets
├── package.json          # Project configuration
└── README.md             # Project documentation
```

### Building for Production

For Windows screensaver deployment:
1. Build the Electron app
2. Rename the executable to have a .scr extension
3. Place in the Windows system directory or register it as a screensaver

## License

ISC
