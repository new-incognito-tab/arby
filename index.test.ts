import axios from 'axios';
import { calcArb, fetchOdds } from './index';  // Import the functions you want to test

jest.mock('axios'); // Mock axios module

// Make sure that axios is typed as a mock function
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Arbitrage Calculation and Fetching Odds', () => {
  
  // Test the calcArb function
  describe('calcArb', () => {
    it('should correctly calculate arbitrage profit', () => {
      const odds = { TeamA: 2.1, TeamB: 2.1 };
      const expectedProfit = 4.92; // Arbitrary value for testing purposes
      
      const result = calcArb(odds);
      
      expect(result).toBeCloseTo(expectedProfit, 2);  // Allow small margin of error
    });
  });

  // Mocking the fetchOdds function
  describe('fetchOdds', () => {
    it('should return the top 10 arbitrage opportunities', async () => {
      // Mock axios.get to resolve with sports data
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          { key: 'soccer', title: 'Soccer' },
        ]
      });
  
      // Mock axios.get to resolve with odds data for the sport
      mockedAxios.get.mockResolvedValueOnce({
        data: [
          {
            home_team: 'TeamA',
            away_team: 'TeamB',
            bookmakers: [
              {
                markets: [
                  {
                    key: 'match_winner',
                    outcomes: [
                      { name: 'TeamA', price: 1.5 },
                      { name: 'TeamB', price: 2.0 }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
  
      // Call fetchOdds and check the result
      const result = await fetchOdds();
  
      // Verify the result
      expect(result).toHaveLength(1);  // Ensure this matches the expected length
      expect(result[0].profit).toBeGreaterThan(0);
      expect(result[0].details.game).toBe('TeamA vs TeamB');
    });
  });
});
