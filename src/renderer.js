// Chart.js will be imported via script tag in HTML
// Import axios for API calls
const axios = window.axios || require('axios');

// Main application class
class QuickMarketsApp {
  constructor() {
    // Initialize screensaver mode flag (will be set properly in init)
    this.isScreensaverMode = false;
    console.log('Renderer initialized, electronAPI available:', !!window.electronAPI);
    
    this.settings = {
      refreshInterval: 30000, // 30 seconds default refresh
      gridSize: 'medium', // Default medium grid
      quoteRefreshInterval: 15000, // 15 seconds for quotes
      chartRefreshInterval: 60000, // 60 seconds for charts
      adaptiveRefresh: true, // Enable adaptive refresh rate based on market hours
      watchlist: [
        { symbol: 'AAPL', type: 'stock' },
        { symbol: 'MSFT', type: 'stock' },
        { symbol: 'GOOGL', type: 'stock' },
        { symbol: 'AMZN', type: 'stock' },
        { symbol: 'TSLA', type: 'stock' },
        { symbol: 'BTC-USD', type: 'crypto' },
        { symbol: 'ETH-USD', type: 'crypto' },
        { symbol: 'EUR=X', type: 'forex' }
      ]
    };
    this.marketData = {};
    this.charts = {};
    this.refreshInterval = null;
    this.uiService = new UiService(this);
    this.apiService = new EnhancedApiService(this);
    
    // Initialize the application
    this.init();
  }

  async loadSettings() {
    try {
      // Load settings from Electron store if available
      if (window.electronAPI) {
        const storedSettings = await window.electronAPI.getSettings();
        if (storedSettings) {
          this.settings = {
            ...this.settings,
            refreshInterval: storedSettings.refreshRate * 1000,
            gridSize: storedSettings.gridSize,
            watchlist: storedSettings.watchlist
          };
          console.log('Settings loaded:', this.settings);
        }
      } else {
        console.warn('electronAPI not available, using default settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async init() {
    try {
      // Load settings from Electron store
      await this.loadSettings();
      
      // Check if we're in screensaver mode
      if (window.electronAPI) {
        this.isScreensaverMode = await window.electronAPI.isScreensaverMode();
        console.log('Screensaver mode check result:', this.isScreensaverMode);
      }
      
      // Initialize UI
      this.uiService.initUI();
      
      // Auto-enter screensaver mode if launched with flag
      if (this.isScreensaverMode) {
        console.log('Auto-entering screensaver mode from command line flag');
        // Use a shorter timeout to ensure it runs quickly on startup
        setTimeout(() => {
          console.log('Activating screensaver mode now');
          this.uiService.toggleScreensaverMode();
        }, 500);
      }
      this.uiService.updateGridSize(this.settings.gridSize);
      
      // Fetch initial market data
      this.fetchAllMarketData();
      
      // Set up refresh interval
      this.startRefreshCycle();
    } catch (error) {
      console.error('Error initializing application:', error);
    }
  }

  startRefreshCycle() {
    // Clear any existing intervals
    if (this.quoteRefreshInterval) {
      clearInterval(this.quoteRefreshInterval);
    }
    
    if (this.chartRefreshInterval) {
      clearInterval(this.chartRefreshInterval);
    }
    
    // Set up separate refresh intervals for quotes and charts
    this.quoteRefreshInterval = setInterval(() => {
      console.log('Refreshing quotes data...');
      this.fetchAllQuotes();
    }, this.settings.quoteRefreshInterval);
    
    this.chartRefreshInterval = setInterval(() => {
      console.log('Refreshing chart data...');
      this.fetchAllCharts();
    }, this.settings.chartRefreshInterval);
    
    // Log refresh rates
    console.log(`Refresh rates set - Quotes: ${this.settings.quoteRefreshInterval/1000}s, Charts: ${this.settings.chartRefreshInterval/1000}s`);
  }

  async fetchAllMarketData() {
    // Fetch both quotes and charts initially
    await this.fetchAllQuotes();
    await this.fetchAllCharts();
  }
  
  async fetchAllQuotes() {
    this.uiService.updateStatus('Fetching quote data...');
    
    try {
      for (const instrument of this.settings.watchlist) {
        try {
          // Show loading state for price only
          this.uiService.setCardLoading(instrument.symbol, true, 'price');
          
          // Fetch quote data
          const quote = await this.apiService.fetchQuote(instrument.symbol);
          
          // Update stored data
          if (!this.marketData[instrument.symbol]) {
            this.marketData[instrument.symbol] = {
              symbol: instrument.symbol,
              type: instrument.type,
              historicalData: []
            };
          }
          
          // Update quote data
          Object.assign(this.marketData[instrument.symbol], quote);
          
          // Update the UI with price data only
          this.uiService.updateMarketCard(instrument.symbol, this.marketData[instrument.symbol]);
          
          // Hide loading state
          this.uiService.setCardLoading(instrument.symbol, false, 'price');
        } catch (error) {
          console.error(`Error fetching quote for ${instrument.symbol}:`, error);
          this.uiService.setCardLoading(instrument.symbol, false, 'price');
        }
      }
      
      this.uiService.updateStatus('Quote data updated');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      this.uiService.updateStatus('Error updating quotes');
    }
  }
  
  async fetchAllCharts() {
    this.uiService.updateStatus('Fetching chart data...');
    
    try {
      for (const instrument of this.settings.watchlist) {
        try {
          // Show loading state for chart only
          this.uiService.setCardLoading(instrument.symbol, true, 'chart');
          
          // Fetch historical data
          const historicalData = await this.apiService.fetchHistoricalData(instrument.symbol);
          
          // Update stored data
          if (!this.marketData[instrument.symbol]) {
            this.marketData[instrument.symbol] = {
              symbol: instrument.symbol,
              type: instrument.type
            };
          }
          
          // Update historical data
          this.marketData[instrument.symbol].historicalData = historicalData;
          
          // Update the chart
          this.uiService.updateChart(instrument.symbol, historicalData);
          
          // Hide loading state
          this.uiService.setCardLoading(instrument.symbol, false, 'chart');
        } catch (error) {
          console.error(`Error fetching chart for ${instrument.symbol}:`, error);
          this.uiService.setCardLoading(instrument.symbol, false, 'chart');
        }
      }
      
      this.uiService.updateStatus('Chart data updated');
    } catch (error) {
      console.error('Error fetching charts:', error);
      this.uiService.updateStatus('Error updating charts');
    }
  }

  async saveSettings(newSettings) {
    try {
      // Save to electron store
      if (window.electronAPI) {
        await window.electronAPI.saveSettings(newSettings);
      } else {
        console.warn('electronAPI not available, settings will not persist');
      }
      
      // Update local settings
      this.settings = newSettings;
      
      // Apply changes
      this.uiService.updateGridSize(this.settings.gridSize);
      this.startRefreshCycle();
      
      // Update UI
      this.uiService.renderWatchlist();
      this.uiService.updateStatus('Settings saved successfully', true);
      
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      this.uiService.updateStatus('Failed to save settings', false);
      return false;
    }
  }

  addToWatchlist(symbol, type) {
    // Check if already exists
    const exists = this.settings.watchlist.some(item => item.symbol === symbol);
    
    if (!exists) {
      this.settings.watchlist.push({ symbol, type });
      this.uiService.renderWatchlist();
      this.uiService.createMarketCard(symbol, type);
      this.fetchAllMarketData();
      return true;
    }
    
    return false;
  }

  removeFromWatchlist(symbol) {
    this.settings.watchlist = this.settings.watchlist.filter(item => item.symbol !== symbol);
    this.uiService.removeMarketCard(symbol);
    this.uiService.renderWatchlist();
    return true;
  }
}

// UI Service class
class UiService {
  constructor(app) {
    this.app = app;
    this.marketGrid = document.getElementById('market-grid');
    this.clockElement = document.getElementById('clock');
    this.dateElement = document.getElementById('date');
    this.statusMessage = document.getElementById('status-message');
    this.connectionStatus = document.getElementById('connection-status');
    this.settingsModal = document.getElementById('settings-modal');
    this.settingsBtn = document.getElementById('settings-btn');
    this.fullscreenBtn = document.getElementById('fullscreen-btn');
    this.saveSettingsBtn = document.getElementById('save-settings-btn');
    this.cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    this.addInstrumentBtn = document.getElementById('add-instrument-btn');
    this.watchlistItems = document.getElementById('watchlist-items');
  }

  initUI() {
    // Initialize clock
    this.startClock();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Render watchlist in settings
    this.renderWatchlist();
    
    // Create market cards
    this.createMarketCards();
  }

  setupEventListeners() {
    // Settings modal
    this.settingsBtn.addEventListener('click', () => this.openSettingsModal());
    this.cancelSettingsBtn.addEventListener('click', () => this.closeSettingsModal());
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
      if (event.target === this.settingsModal) {
        this.closeSettingsModal();
      }
    });
    
    // Close button in modal
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeSettingsModal());
    }
    
    // Save settings
    this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    
    // Add instrument
    this.addInstrumentBtn.addEventListener('click', () => this.addInstrument());
    
    // Fullscreen toggle
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    
    // Screensaver toggle
    const screensaverBtn = document.getElementById('screensaver-btn');
    if (screensaverBtn) {
      screensaverBtn.addEventListener('click', () => this.toggleScreensaverMode());
    }
    
    // Exit screensaver mode on key press
    document.addEventListener('keydown', (e) => {
      if (document.body.classList.contains('screensaver-mode')) {
        // On first keypress, show UI elements
        if (e.key === 'Escape') {
          this.exitScreensaverMode();
        } else {
          // Show UI elements temporarily
          const header = document.querySelector('.app-header');
          const statusBar = document.querySelector('.status-bar');
          if (header) header.style.opacity = '1';
          if (statusBar) statusBar.style.opacity = '1';
          
          // Hide them again after 3 seconds
          setTimeout(() => {
            if (document.body.classList.contains('screensaver-mode')) {
              if (header) header.style.opacity = '0';
              if (statusBar) statusBar.style.opacity = '0';
            }
          }, 3000);
        }
      }
    });
  }

  startClock() {
    const updateClock = () => {
      const now = new Date();
      
      // Update time
      this.clockElement.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      // Update date
      this.dateElement.textContent = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    
    // Initial update
    updateClock();
    
    // Update every second
    setInterval(updateClock, 1000);
  }

  createMarketCards() {
    // Clear existing cards
    this.marketGrid.innerHTML = '';
    
    // Create cards for each instrument in watchlist
    this.app.settings.watchlist.forEach(instrument => {
      this.createMarketCard(instrument.symbol, instrument.type);
    });
  }

  createMarketCard(symbol, type) {
    // Create card element
    const card = document.createElement('div');
    card.className = 'market-card';
    card.id = `card-${symbol}`;
    
    // Create card content
    card.innerHTML = `
      <div class="card-header">
        <div class="symbol">${symbol}</div>
        <div class="instrument-type">${type}</div>
      </div>
      <div class="price-container">
        <div class="current-price">---.--</div>
        <div class="price-change">
          <span class="change-amount">---.--</span>
          <span class="change-percent">(---.--)</span>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="chart-${symbol}"></canvas>
      </div>
    `;
    
    // Add to grid
    this.marketGrid.appendChild(card);
    
    // Initialize chart
    this.initChart(symbol);
  }

  removeMarketCard(symbol) {
    const card = document.getElementById(`card-${symbol}`);
    if (card) {
      card.remove();
    }
    
    // Clean up chart instance
    if (this.app.charts[symbol]) {
      this.app.charts[symbol].destroy();
      delete this.app.charts[symbol];
    }
  }

  initChart(symbol) {
    const ctx = document.getElementById(`chart-${symbol}`).getContext('2d');
    
    // Create placeholder chart
    this.app.charts[symbol] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array(24).fill(''),
        datasets: [{
          label: symbol,
          data: Array(24).fill(null),
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: true,
          backgroundColor: (context) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, 'rgba(33, 150, 243, 0)');
            gradient.addColorStop(1, 'rgba(33, 150, 243, 0.2)');
            return gradient;
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: true,
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          x: {
            display: false,
            type: 'time',
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm'
              }
            },
            // This prevents the chart from expanding to fill the entire view
            min: function() {
              const now = new Date();
              return new Date(now.getTime() - (4 * 60 * 60 * 1000)).toISOString(); // 4 hours ago
            },
            max: function() {
              return new Date().toISOString(); // current time
            }
          },
          y: {
            display: false,
            beginAtZero: false
          }
        },
        animation: {
          duration: 1000
        }
      }
    });
  }

  updateMarketCard(symbol, data) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    // Update price and change
    const priceElement = card.querySelector('.current-price');
    const changeAmountElement = card.querySelector('.change-amount');
    const changePercentElement = card.querySelector('.change-percent');
    
    if (priceElement) priceElement.textContent = data.price.toFixed(2);
    
    if (changeAmountElement) {
      // Add '+' sign for positive changes
      changeAmountElement.textContent = data.change >= 0 ? 
        `+${data.change.toFixed(2)}` : 
        `${data.change.toFixed(2)}`;
      changeAmountElement.classList.remove('positive', 'negative');
      changeAmountElement.classList.add(data.change >= 0 ? 'positive' : 'negative');
    }
    
    if (changePercentElement) {
      // Add '+' sign for positive percentage changes
      changePercentElement.textContent = data.change >= 0 ? 
        `(+${data.changePercent.toFixed(2)}%)` : 
        `(${data.changePercent.toFixed(2)}%)`;
      changePercentElement.classList.remove('positive', 'negative');
      changePercentElement.classList.add(data.change >= 0 ? 'positive' : 'negative');
    }
    
    // Add visual indicator for fallback/simulated data
    if (data.isFallback) {
      // Add fallback indicator if not already present
      if (!card.classList.contains('fallback-data')) {
        card.classList.add('fallback-data');
        
        // Add indicator badge if not already present
        if (!card.querySelector('.fallback-indicator')) {
          const indicator = document.createElement('div');
          indicator.className = 'fallback-indicator';
          indicator.textContent = 'SIMULATED';
          card.appendChild(indicator);
        }
      }
    } else {
      // Remove fallback indicator if data is real
      card.classList.remove('fallback-data');
      const indicator = card.querySelector('.fallback-indicator');
      if (indicator) indicator.remove();
    }
    
    // Update color based on change
    const priceChangeElement = card.querySelector('.price-change');
    if (data.change >= 0) {
      priceChangeElement.classList.add('positive');
      priceChangeElement.classList.remove('negative');
    } else {
      priceChangeElement.classList.add('negative');
      priceChangeElement.classList.remove('positive');
    }
    
    // Update chart
    this.updateChart(symbol, data.historicalData);
  }

  updateChart(symbol, historicalData) {
    const chart = this.app.charts[symbol];
    if (!chart) return;
    
    // Update chart data with proper time format for time-based x-axis
    chart.data.labels = historicalData.map(point => new Date(point.timestamp * 1000).toISOString());
    
    // Format data for time-based charts
    chart.data.datasets[0].data = historicalData.map(point => ({
      x: new Date(point.timestamp * 1000).toISOString(),
      y: point.close || point.price
    }));
    
    // Update chart color based on trend
    const firstPrice = historicalData[0]?.close || historicalData[0]?.price || 0;
    const lastPrice = historicalData[historicalData.length - 1]?.close || historicalData[historicalData.length - 1]?.price || 0;
    const trend = lastPrice - firstPrice;
    
    const color = trend >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)';
    const gradientColor = trend >= 0 ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
    
    chart.data.datasets[0].borderColor = color;
    
    // Update gradient
    chart.data.datasets[0].backgroundColor = (context) => {
      const chart = context.chart;
      const { ctx, chartArea } = chart;
      if (!chartArea) return null;
      
      const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, gradientColor);
      return gradient;
    };
    
    // Update chart
    chart.update();
  }

  setCardLoading(symbol, isLoading, component = 'all') {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    // Handle different loading states for different card components
    if (component === 'price' || component === 'all') {
      const priceContainer = card.querySelector('.price-container');
      if (priceContainer) {
        if (isLoading) {
          priceContainer.classList.add('loading');
        } else {
          priceContainer.classList.remove('loading');
        }
      }
    }
    
    if (component === 'chart' || component === 'all') {
      const chartContainer = card.querySelector('.chart-container');
      if (chartContainer) {
        if (isLoading) {
          chartContainer.classList.add('loading');
        } else {
          chartContainer.classList.remove('loading');
        }
      }
    }
    
    if (isLoading) {
      card.classList.add('loading');
    } else {
      card.classList.remove('loading');
    }
  }

  showErrorForSymbol(symbol, errorMessage) {
    const card = document.getElementById(`card-${symbol}`);
    if (!card) return;
    
    // Remove loading state
    card.classList.remove('loading');
    
    // Show error in price
    const priceElement = card.querySelector('.current-price');
    priceElement.textContent = 'Error';
    
    // Show error in change
    const changeAmountElement = card.querySelector('.change-amount');
    const changePercentElement = card.querySelector('.change-percent');
    
    changeAmountElement.textContent = '--';
    changePercentElement.textContent = '--';
    
    // Add error class
    card.classList.add('error');
    
    // Log error
    console.error(`Error for ${symbol}: ${errorMessage}`);
  }

  updateStatus(message, isConnected = true) {
    this.statusMessage.textContent = message;
    
    if (isConnected) {
      this.connectionStatus.classList.add('connected');
      this.connectionStatus.classList.remove('disconnected');
    } else {
      this.connectionStatus.classList.add('disconnected');
      this.connectionStatus.classList.remove('connected');
    }
  }

  updateGridSize(size) {
    // Remove existing size classes
    this.marketGrid.classList.remove('small', 'medium', 'large');
    
    // Add new size class
    this.marketGrid.classList.add(size);
  }

  openSettingsModal() {
    // Populate settings form with current values
    document.getElementById('refresh-rate').value = this.app.settings.refreshRate;
    
    // Set grid size radio
    const gridRadio = document.querySelector(`input[name="grid-size"][value="${this.app.settings.gridSize}"]`);
    if (gridRadio) {
      gridRadio.checked = true;
    }
    
    // Show modal
    this.settingsModal.style.display = 'block';
  }

  closeSettingsModal() {
    this.settingsModal.style.display = 'none';
  }

  saveSettings() {
    // Get values from form
    const refreshRate = parseInt(document.getElementById('refresh-rate').value, 10);
    const gridSize = document.querySelector('input[name="grid-size"]:checked').value;
    
    // Create new settings object
    const newSettings = {
      refreshRate: refreshRate,
      gridSize: gridSize,
      watchlist: [...this.app.settings.watchlist] // Keep existing watchlist
    };
    
    // Save settings
    this.app.saveSettings(newSettings);
    
    // Close modal
    this.closeSettingsModal();
  }

  renderWatchlist() {
    // Clear existing items
    this.watchlistItems.innerHTML = '';
    
    // Add items for each instrument in watchlist
    this.app.settings.watchlist.forEach(instrument => {
      const item = document.createElement('div');
      item.className = 'watchlist-item';
      
      item.innerHTML = `
        <div>
          <span class="watchlist-symbol">${instrument.symbol}</span>
          <span class="watchlist-type">${instrument.type}</span>
        </div>
        <button class="remove-btn" data-symbol="${instrument.symbol}">✕</button>
      `;
      
      this.watchlistItems.appendChild(item);
      
      // Add event listener for remove button
      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.app.removeFromWatchlist(instrument.symbol);
      });
    });
  }

  addInstrument() {
    const symbolInput = document.getElementById('new-symbol');
    const typeSelect = document.getElementById('instrument-type');
    
    const symbol = symbolInput.value.trim().toUpperCase();
    const type = typeSelect.value;
    
    if (symbol) {
      const added = this.app.addToWatchlist(symbol, type);
      
      if (added) {
        // Clear input
        symbolInput.value = '';
      } else {
        alert('This symbol is already in your watchlist');
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
  
  toggleScreensaverMode() {
    if (document.body.classList.contains('screensaver-mode')) {
      this.exitScreensaverMode();
    } else {
      document.body.classList.add('screensaver-mode');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
      this.closeSettingsModal();
      this.updateStatus('Screensaver mode active', true);
      this.app.fetchAllMarketData();
      
      // Hide UI elements initially
      const header = document.querySelector('.app-header');
      const statusBar = document.querySelector('.status-bar');
      if (header) header.style.opacity = '0';
      if (statusBar) statusBar.style.opacity = '0';
    }
  }
  
  exitScreensaverMode() {
    document.body.classList.remove('screensaver-mode');
    this.updateStatus('Screensaver mode deactivated', true);
  }
}

// API Service class
class EnhancedApiService {
  constructor(app) {
    this.app = app;
    this.cache = {};
    this.lastRequestTime = {};
    this.requestCount = 0;
    this.maxRequestsPerMinute = 100; // Yahoo Finance API limit
    this.quoteCacheDuration = 10; // 10 seconds for quotes
    this.historicalCacheDuration = 60; // 60 seconds for historical data
    this.offlineMode = false;
  }

  async fetchMarketData(symbol, type) {
    try {
      // Check if we need to use fallback data
      if (this.offlineMode || this.isRateLimited()) {
        return this.generateFallbackData(symbol, type);
      }
      const quoteData = await this.fetchQuote(symbol);
      const historicalData = await this.fetchHistoricalData(symbol);
      
      // Format the data based on the instrument type
      const formattedData = this.formatMarketData(quoteData, historicalData, type);
      
      // Add a flag to indicate if this is real data or fallback
      formattedData.isFallback = quoteData.isFallback || false;
      
      return formattedData;
    } catch (error) {
      console.error(`Error fetching data for ${symbol}:`, error);
      
      // Use fallback data on error
      return this.generateFallbackData(symbol, type);
    }
  }

  async fetchQuote(symbol, retryCount = 0) {
    try {
      // Make a real API call to Yahoo Finance
      console.log(`Fetching quote data for ${symbol}...`);
      const response = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`, {
        timeout: 5000 // 5 second timeout
      });
      
      // Validate the response data
      if (!response.data || !response.data.chart || !response.data.chart.result || !response.data.chart.result[0]) {
        console.error(`Invalid response format for ${symbol}:`, response.data);
        return this.generateFallbackQuote(symbol);
      }
      
      // Extract the quote data from the response
      const result = response.data.chart.result[0];
      if (!result.meta) {
        console.error(`Missing meta data for ${symbol}:`, result);
        return this.generateFallbackQuote(symbol);
      }
      
      const quote = result.meta;
      const timestamp = result.timestamp;
      
      // Get the latest price and previous close
      const latestPrice = quote.regularMarketPrice || quote.chartPreviousClose || quote.previousClose;
      // Yahoo Finance API provides chartPreviousClose instead of previousClose for most symbols
      const previousClose = quote.previousClose || quote.chartPreviousClose || latestPrice;
      
      // Calculate change and change percent
      const change = latestPrice - previousClose;
      const changePercent = (change / previousClose) * 100;
      
      return {
        symbol: symbol,
        price: latestPrice,
        change: change,
        changePercent: changePercent,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error.message);
      
      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying fetch for ${symbol} (attempt ${retryCount + 1})...`);
        // Wait for increasing time before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.fetchQuote(symbol, retryCount + 1);
      }
      
      // After max retries, fall back to simulated data
      console.warn(`Max retries reached for ${symbol}, using fallback data`);
      return this.generateFallbackQuote(symbol);
    }
  }
  
  generateFallbackQuote(symbol) {
    // Generate fallback quote data when API fails
    return {
      symbol: symbol,
      price: this.getRandomPrice(100, 1000),
      change: this.getRandomPrice(-20, 20),
      changePercent: this.getRandomPrice(-5, 5),
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: Date.now(),
      isFallback: true // Flag to indicate this is simulated data
    };
  }

  async fetchHistoricalData(symbol, retryCount = 0) {
    try {
      // Calculate start and end dates for historical data (last 4 hours)
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (60 * 60 * 4); // 4 hours ago
      
      // Make a real API call to Yahoo Finance for historical data
      console.log(`Fetching 4-hour historical data for ${symbol}...`);
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=5m`,
        { timeout: 5000 } // 5 second timeout
      );
      
      // Validate the response data
      if (!response.data || !response.data.chart || !response.data.chart.result || !response.data.chart.result[0]) {
        console.error(`Invalid historical data response format for ${symbol}:`, response.data);
        return this.generateFallbackHistoricalData(symbol);
      }
      
      // Extract the historical data from the response
      const result = response.data.chart.result[0];
      
      // Validate required data properties
      if (!result.timestamp || !result.indicators || !result.indicators.quote || !result.indicators.quote[0]) {
        console.error(`Missing required historical data properties for ${symbol}:`, result);
        return this.generateFallbackHistoricalData(symbol);
      }
      
      const timestamps = result.timestamp || [];
      const quotes = result.indicators.quote[0] || {};
      const closes = quotes.close || [];
      
      // Format the historical data
      const historicalData = [];
      
      // Use up to 24 data points for consistency
      const dataPoints = Math.min(timestamps.length, 24);
      const step = Math.max(1, Math.floor(timestamps.length / dataPoints));
      
      for (let i = 0; i < timestamps.length; i += step) {
        if (historicalData.length >= dataPoints) break;
        
        if (timestamps[i] && closes[i] !== null && closes[i] !== undefined) {
          const date = new Date(timestamps[i] * 1000);
          historicalData.push({
            time: date.toISOString(),
            price: closes[i]
          });
        }
      }
      
      return historicalData.length > 0 ? historicalData : this.generateFallbackHistoricalData(symbol);
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error.message);
      
      // Implement retry logic (max 3 retries)
      if (retryCount < 3) {
        console.log(`Retrying historical data fetch for ${symbol} (attempt ${retryCount + 1})...`);
        // Wait for increasing time before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.fetchHistoricalData(symbol, retryCount + 1);
      }
      
      // After max retries, fall back to simulated data
      console.warn(`Max retries reached for historical data of ${symbol}, using fallback data`);
      return this.generateFallbackHistoricalData(symbol);
    }
  }
  
  generateFallbackHistoricalData(symbol) {
    // Generate fallback historical data when API fails
    const points = 48; // 4 hours with 5-minute intervals
    const basePrice = this.getRandomPrice(100, 1000);
    const volatility = 0.005; // 0.5% volatility for 5-minute intervals
    
    const historicalData = [];
    const now = Date.now();
    const fiveMinutesMs = 5 * 60 * 1000;
    
    // Generate data points for the last 4 hours with 5-minute intervals
    for (let i = points - 1; i >= 0; i--) {
      const timestamp = now - (i * fiveMinutesMs);
      const date = new Date(timestamp);
      
      // Random walk price generation
      const change = basePrice * volatility * (Math.random() * 2 - 1);
      const price = basePrice + (change * (points - i));
      
      historicalData.push({
        timestamp: Math.floor(timestamp / 1000),
        date: date.toISOString(),
        open: price - Math.random(),
        high: price + Math.random(),
        low: price - Math.random(),
        close: price,
        volume: Math.floor(Math.random() * 100000)
      });
    }
    
    return historicalData;
  }

  formatMarketData(quoteData, historicalData, type) {
    // Format data based on instrument type
    let formattedData = {
      symbol: quoteData.symbol,
      price: quoteData.price,
      change: quoteData.change,
      changePercent: quoteData.changePercent,
      volume: quoteData.volume,
      marketCap: quoteData.marketCap,
      timestamp: quoteData.timestamp,
      historicalData: historicalData,
      type: type
    };
    
    // Add type-specific formatting
    switch (type) {
      case 'crypto':
        // Cryptocurrencies typically have more decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(2));
        break;
      case 'forex':
        // Forex typically shows 4 decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(4));
        break;
      default:
        // Stocks typically show 2 decimal places
        formattedData.price = parseFloat(formattedData.price.toFixed(2));
    }
    
    return formattedData;
  }

  generateFallbackData(symbol, type) {
    // Generate synthetic data when API is unavailable
    const basePrice = this.getRandomPrice(100, 1000);
    const change = this.getRandomPrice(-20, 20);
    const changePercent = (change / basePrice) * 100;
    
    // Generate historical data points using the fallback method
    const historicalData = this.generateFallbackHistoricalData(symbol);
    
    return {
      symbol: symbol,
      price: basePrice + change,
      change: change,
      changePercent: changePercent,
      volume: Math.floor(Math.random() * 10000000),
      marketCap: Math.floor(Math.random() * 1000000000000),
      timestamp: Date.now(),
      historicalData: historicalData,
      type: type,
      isFallback: true
    };
  }

  trackRequest() {
    const now = Date.now();
    this.requestCount++;
    
    // Reset counter after a minute
    setTimeout(() => {
      this.requestCount--;
    }, 60000);
  }

  isRateLimited() {
    return this.requestCount >= this.maxRequestsPerMinute;
  }

  async simulateApiDelay() {
    // Simulate network delay
    const delay = Math.random() * 300 + 100; // 100-400ms delay
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  getRandomPrice(min, max) {
    return Math.random() * (max - min) + min;
  }

  setOfflineMode(offline) {
    this.offlineMode = offline;
    return this.offlineMode;
  }
}

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new QuickMarketsApp();
});
