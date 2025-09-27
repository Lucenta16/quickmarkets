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

### Development Testing

1. Clone the repository:
```bash
git clone https://github.com/Lucenta16/quickmarkets.git
cd quickmarkets
```

2. Install dependencies:
```bash
npm install
```

3. Run the application in different modes:
```bash
# Run in screensaver mode (fullscreen)
npm start

# Run in configuration mode (settings dialog)
npm run config

# Run in preview mode (small window)
npm run preview
```

### Windows Screensaver Installation

1. Build the screensaver file:
```bash
npm run build-win
npm run create-screensaver
```

2. Copy the generated `QuickMarkets.scr` file from the `release-builds` folder to `C:\Windows\System32\`

3. Right-click on your desktop, select "Personalize" → "Lock screen" → "Screen saver settings"

4. Select "QuickMarkets" from the dropdown menu

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

### Windows Screensaver Settings

1. Right-click on your desktop and select "Personalize"
2. Go to "Lock screen" and click "Screen saver settings"
3. Select "QuickMarkets" from the dropdown menu
4. Click "Settings" to configure the screensaver:

### Configuring the Screensaver

#### Adding Instruments
1. In the Settings dialog, go to the Watchlist section
2. Enter a symbol (e.g., AAPL)
3. Select the instrument type (stock, crypto, forex)
4. Click "Add"

#### Changing Display Settings
1. Adjust the refresh rate (in seconds)
2. Select your preferred grid size (small, medium, large)
3. Click "Save Settings"

### Screensaver Activation

The screensaver will activate automatically based on your Windows screensaver settings (idle time). You can also:

1. Click "Preview" in the Windows screensaver settings dialog
2. Press Win+L to lock your computer and activate the screensaver

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

```bash
# Build the portable executable
npm run build-win

# Create the .scr file
npm run create-screensaver
```

This will generate two files in the `release-builds` folder:
1. `QuickMarkets-1.0.0.exe` - The portable executable
2. `QuickMarkets.scr` - The Windows screensaver file

To install the screensaver:
1. Copy `QuickMarkets.scr` to `C:\Windows\System32\`
2. Right-click on desktop → Personalize → Lock screen → Screen saver settings
3. Select "QuickMarkets" from the dropdown

## License

MIT
