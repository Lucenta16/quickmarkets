const axios = require('axios');

// Test function for Yahoo Finance API
async function testYahooFinanceAPI() {
  const symbols = ['AAPL', 'MSFT', 'GOOGL', 'BTC-USD', 'ETH-USD', 'EUR=X', 'GBP=X'];
  
  console.log('===== TESTING YAHOO FINANCE API =====');
  
  for (const symbol of symbols) {
    try {
      console.log(`\nTesting symbol: ${symbol}`);
      
      // Test quote data
      console.log(`Fetching quote data for ${symbol}...`);
      const quoteResponse = await axios.get(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d`);
      
      if (quoteResponse.data && quoteResponse.data.chart && quoteResponse.data.chart.result && quoteResponse.data.chart.result[0]) {
        const result = quoteResponse.data.chart.result[0];
        const quote = result.meta;
        
        console.log('✅ Quote data successfully retrieved:');
        console.log(`   Symbol: ${symbol}`);
        console.log(`   Price: ${quote.regularMarketPrice}`);
        console.log(`   Previous Close: ${quote.previousClose}`);
        console.log('   Full meta object:');
        console.log(JSON.stringify(quote, null, 2));
        
        // Calculate change using chartPreviousClose if previousClose is undefined
        const previousClose = quote.previousClose || quote.chartPreviousClose;
        const change = quote.regularMarketPrice - previousClose;
        const changePercent = (change / previousClose) * 100;
        console.log(`   Using chartPreviousClose: ${quote.chartPreviousClose}`);
        console.log(`   Calculated change: ${change.toFixed(2)} (${changePercent.toFixed(2)}%)`);
      } else {
        console.log('❌ Failed to get valid quote data');
        console.log(quoteResponse.data);
      }
      
      // Test historical data
      console.log(`\nFetching historical data for ${symbol}...`);
      const endDate = Math.floor(Date.now() / 1000);
      const startDate = endDate - (60 * 60 * 24 * 30); // 30 days ago
      
      const historicalResponse = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startDate}&period2=${endDate}&interval=1d`
      );
      
      if (historicalResponse.data && 
          historicalResponse.data.chart && 
          historicalResponse.data.chart.result && 
          historicalResponse.data.chart.result[0] &&
          historicalResponse.data.chart.result[0].timestamp &&
          historicalResponse.data.chart.result[0].indicators &&
          historicalResponse.data.chart.result[0].indicators.quote &&
          historicalResponse.data.chart.result[0].indicators.quote[0]) {
        
        const result = historicalResponse.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const closes = quotes.close;
        
        console.log('✅ Historical data successfully retrieved:');
        console.log(`   Data points: ${timestamps.length}`);
        console.log(`   First date: ${new Date(timestamps[0] * 1000).toISOString()}`);
        console.log(`   Last date: ${new Date(timestamps[timestamps.length - 1] * 1000).toISOString()}`);
        console.log(`   First price: ${closes[0]}`);
        console.log(`   Last price: ${closes[closes.length - 1]}`);
      } else {
        console.log('❌ Failed to get valid historical data');
        console.log(historicalResponse.data);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${symbol}:`, error.message);
    }
  }
}

// Run the test
testYahooFinanceAPI().catch(error => {
  console.error('Test failed with error:', error);
});
