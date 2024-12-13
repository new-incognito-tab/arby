import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.ODDS_API_KEY;
const API_URL = "https://api.the-odds-api.com/v4/sports";
const regions = "us,uk,eu";  // Example regions
const bookmakers = "pinnacle,bet365";  // Example bookmakers

export function calcArb(opportunity: Record<string, number>): number {
    const inverseSum = Object.values(opportunity).reduce((sum, odds) => sum + 1 / odds, 0);
    // look for positive value
    return 100 / inverseSum - 100;
}

export async function fetchOdds() {
  try {
      const sportsResponse = await axios.get(
          `${API_URL}?apiKey=${API_KEY}&regions=${regions}&bookmakers=${bookmakers}`
      );
      console.log("Sports Response Data:", sportsResponse.data); // Debugging

      const sports = sportsResponse.data;
      const allOpportunities: { sport: string; profit: number; details: any }[] = [];

      for (const sport of sports) {
          const oddsResponse = await axios.get(
              `${API_URL}/${sport.key}/odds/?apiKey=${API_KEY}&regions=${regions}&bookmakers=${bookmakers}`
          );
          //console.log("Odds Data:", oddsResponse.data); // Debugging
          
          const oddsData = oddsResponse.data;

          oddsData.forEach((game: any) => {
              //console.log("Game Data:", game); // Debugging
              const markets = game.bookmakers.flatMap((bookmaker: any) =>
                  bookmaker.markets
              );

              markets.forEach((market: any) => {
                  console.log("Market Data:", market); // Debugging
                  const odds = market.outcomes.reduce((acc: any, outcome: any) => {
                      acc[outcome.name] = outcome.price;
                      return acc;
                  }, {});

                  const profit = calcArb(odds);
                  console.log("Calculated Profit:", profit); // Debugging
                  if (profit > 0) {
                      allOpportunities.push({
                          sport: sport.title,
                          profit,
                          details: {
                              game: game.home_team + " vs " + game.away_team,
                              market: market.key,
                              odds,
                          },
                      });
                  }
              });
          });
      }

      // Sort by profit and get the top 10 opportunities
      const topOpportunities = allOpportunities
          .sort((a, b) => b.profit - a.profit)
          .slice(0, 10);

      console.log("Top 10 Arbitrage Opportunities:");
      console.table(
          topOpportunities.map((opportunity) => ({
              Sport: opportunity.sport,
              Game: opportunity.details.game,
              Market: opportunity.details.market,
              Profit: `${opportunity.profit.toFixed(2)}%`,
              Odds: opportunity.details.odds,
          }))
      );

      return topOpportunities;  // Return the opportunities
  } catch (error) {
      if (axios.isAxiosError(error)) {
          console.error("Axios error:", error.message);
          console.error("Error details:", error.response?.data);
      } else if (error instanceof Error) {
          console.error("General error:", error.message);
      } else {
          console.error("Unknown error:", error);
      }
      return [];  // Return an empty array in case of an error
  }
}


// Schedule the program to run on the hour
fetchOdds();
setInterval(fetchOdds, 60 * 60 * 1000);
