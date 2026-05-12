/**
 * Test script for Tournament Standings Logic
 * Rule: Win +1, Loss -1, Draw 0
 */
import { Tournament } from '../domain/Tournament.js';

function runTests() {
  console.log("=== Testing Tournament Standings Logic ===");

  // 1. Setup Mock Tournament
  const tournament = new Tournament({
    id: 'test-tournament',
    name: 'Test Tournament',
    format: 'round_robin'
  });

  // 2. Setup Mock Clubs
  const clubA = { id: 'club-a', name: 'Club A', logoUrl: '' };
  const clubB = { id: 'club-b', name: 'Club B', logoUrl: '' };
  const clubC = { id: 'club-c', name: 'Club C', logoUrl: '' };

  // 3. Mock Registrations
  tournament.registrations = [
    { clubId: 'club-a', club: clubA, status: 'approved' },
    { clubId: 'club-b', club: clubB, status: 'approved' },
    { clubId: 'club-c', club: clubC, status: 'approved' }
  ];

  console.log("Initial Standings (0 matches):");
  printStandings(tournament.calculateStandings());

  // 4. Case 1: Club A wins against Club B (1-0)
  tournament.matches = [
    {
      id: 'match-1',
      home_club_id: 'club-a',
      away_club_id: 'club-b',
      home_score: 1,
      away_score: 0,
      status: 'completed'
    }
  ];
  
  console.log("\nCase 1: Club A (1) - (0) Club B");
  let standings = tournament.calculateStandings();
  printStandings(standings);
  
  // Assertions
  assert(standings[0].clubId === 'club-a', "Club A should be at position 0");
  assert(standings[0].rank === 1, "Club A should have rank 1");
  assert(standings[0].points === 2, "Club A should have 2 points (Win +2)");
  assert(standings[2].clubId === 'club-b', "Club B should be at position 2");
  assert(standings[2].rank === 2, "Club B should have rank 2");
  assert(standings[2].points === -1, "Club B should have -1 point (Loss -1)");

  // 5. Case 2: Club B wins against Club C (2-1)
  tournament.matches.push({
    id: 'match-2',
    home_club_id: 'club-b',
    away_club_id: 'club-c',
    home_score: 2,
    away_score: 1,
    status: 'completed'
  });

  console.log("\nCase 2: Club B (2) - (1) Club C");
  standings = tournament.calculateStandings();
  printStandings(standings);

  // Club B now has -1 + 2 = 1 point
  // Club A: 2 pts (Rank 1)
  // Club B: 1 pt (Rank 2)
  // Club C: -1 pt (Rank 3)
  assert(standings.find(s => s.clubId === 'club-b').rank === 2, "Club B should have rank 2");
  assert(standings.find(s => s.clubId === 'club-c').rank === 3, "Club C should have rank 3");

  // 6. Case 3: Club A draws with Club C (2-2)
  tournament.matches.push({
    id: 'match-3',
    home_club_id: 'club-a',
    away_club_id: 'club-c',
    home_score: 2,
    away_score: 2,
    status: 'completed'
  });

  console.log("\nCase 3: Club A (2) - (2) Club C (Draw)");
  standings = tournament.calculateStandings();
  printStandings(standings);

  // Club A: 2 (win) + 1 (draw) = 3 points (Rank 1)
  // Club B: 1 point (Rank 2)
  // Club C: -1 (loss) + 1 (draw) = 0 points (Rank 3)
  assert(standings.find(s => s.clubId === 'club-a').rank === 1, "Club A should have rank 1");
  assert(standings.find(s => s.clubId === 'club-b').rank === 2, "Club B should have rank 2");
  assert(standings.find(s => s.clubId === 'club-c').rank === 3, "Club C should have rank 3");

  // 7. Case 4: Tie Points - Club B draws with Club C (1-1)
  // Club B: 1 + 1 = 2 pts
  // Club C: 0 + 1 = 1 pt
  // Standings would be: A (3pts), B (2pts), C (1pt). 
  // Let's make B win instead to tie with A
  tournament.matches.push({
    id: 'match-4',
    home_club_id: 'club-b',
    away_club_id: 'club-c',
    home_score: 3,
    away_score: 0,
    status: 'completed'
  });
  
  console.log("\nCase 4: Club B (3) - (0) Club C (B ties with A)");
  standings = tournament.calculateStandings();
  printStandings(standings);
  
  // Club A: 3 pts, Rank 1
  // Club B: 1 (previous) + 2 (win) = 3 pts, Rank 1
  // Club C: 1 (previous) + -1 (loss) = 0 pts, Rank 2 (Continuous)
  assert(standings[0].points === 3 && standings[1].points === 3, "A and B should have 3 points");
  assert(standings[0].rank === 1 && standings[1].rank === 1, "A and B should share rank 1");
  assert(standings[2].points === 0, "C should have 0 points");
  assert(standings[2].rank === 2, "C should have rank 2 (No gap after two rank 1s)");

  console.log("\n=== All Tests Passed! ===");
}

function printStandings(standings) {
  console.table(standings.map(s => ({
    Rank: s.rank,
    Team: s.clubName,
    P: s.played,
    W: s.won,
    D: s.drawn,
    L: s.lost,
    GD: s.goalDifference,
    Pts: s.points
  })));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error("Assertion Failed: " + message);
  }
}

runTests();
