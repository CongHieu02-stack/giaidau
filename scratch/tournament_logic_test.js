
import { distributeTeamsIntoGroups } from '../src/features/tournaments/adminTournamentManagement.js';
import { Tournament } from '../src/domain/Tournament.js';

// Mock teams
const teams = [
  { id: '1', name: 'Team A' },
  { id: '2', name: 'Team B' },
  { id: '3', name: 'Team C' },
  { id: '4', name: 'Team D' },
  { id: '5', name: 'Team E' }
];

console.log('--- Testing Group Distribution ---');
const groups = distributeTeamsIntoGroups(teams, 2);
console.log('Groups created:', groups.length);
groups.forEach(g => {
  console.log(`${g.name}: ${g.teams.length} teams (${g.teams.map(t => t.name).join(', ')})`);
});

const isBalanced = Math.abs(groups[0].teams.length - groups[1].teams.length) <= 1;
console.log('Is balanced:', isBalanced ? 'PASS' : 'FAIL');

console.log('\n--- Testing Standings with Negative Points ---');
const tournament = new Tournament({
  id: 't1',
  registrations: teams.map(t => ({ club_id: t.id, club: t, status: 'approved', group_id: 'g1' })),
  matches: [
    { home_club_id: '1', away_club_id: '2', home_score: 2, away_score: 0, status: 'completed', group_id: 'g1' },
    { home_club_id: '3', away_club_id: '4', home_score: 1, away_score: 1, status: 'completed', group_id: 'g1' }
  ]
});

const standings = tournament.calculateStandings('g1');
console.log('Standings for G1:');
standings.forEach(s => {
  console.log(`${s.rank}. ${s.name}: ${s.points} pts (W:${s.won} D:${s.drawn} L:${s.lost} GD:${s.gd})`);
});

// Team 1 should have 2 points
// Team 2 should have -1 point (Loss -1)
// Team 3 and 4 should have 1 point
// Team 5 should have 0 points (Played 0)

const team1 = standings.find(s => s.clubId === '1');
const team2 = standings.find(s => s.clubId === '2');
const team3 = standings.find(s => s.clubId === '3');

console.log('Team 1 Points (Expected 2):', team1.points === 2 ? 'PASS' : 'FAIL');
console.log('Team 2 Points (Expected -1):', team2.points === -1 ? 'PASS' : 'FAIL');
console.log('Team 3 Points (Expected 1):', team3.points === 1 ? 'PASS' : 'FAIL');

console.log('\n--- Testing Dense Ranking ---');
// Adding another match to create tie
tournament.matches.push({ home_club_id: '1', away_club_id: '3', home_score: 0, away_score: 1, status: 'completed', group_id: 'g1' });
// Now:
// Team 1: 2 matches, 1W 1L, points: 2 - 1 = 1
// Team 3: 2 matches, 1W 1D, points: 2 + 1 = 3
// Team 4: 1 match, 1D, points: 1
// Team 1 and Team 4 have same points (1)
// GD: Team 1 (2-1=1), Team 4 (1-1=0) -> Team 1 ranks higher

const updatedStandings = tournament.calculateStandings('g1');
console.log('Updated Standings:');
updatedStandings.forEach(s => {
  console.log(`${s.rank}. ${s.name}: ${s.points} pts (GD:${s.gd})`);
});

const team1Rank = updatedStandings.find(s => s.clubId === '1').rank;
const team4Rank = updatedStandings.find(s => s.clubId === '4').rank;
console.log('Team 1 Rank vs Team 4 Rank:', team1Rank < team4Rank ? 'PASS' : 'FAIL');

console.log('\n--- Testing Bye Logic for Knockout ---');
import { generateKnockout } from '../src/features/tournaments/adminTournamentManagement.js';

const venues = [{ id: 'v1', name: 'Venue 1' }];
const startDate = new Date();
const matchTimes = ['08:00'];

const knockoutMatches8 = generateKnockout('t2', teams.concat([{id: '6', name: 'F'}, {id: '7', name: 'G'}, {id: '8', name: 'H'}]), venues, startDate, matchTimes);
console.log('Knockout with 8 teams, matches in Round 1:', knockoutMatches8.length); // Should be 4

const knockoutMatches6 = generateKnockout('t2', teams.concat([{id: '6', name: 'F'}]), venues, startDate, matchTimes);
console.log('Knockout with 6 teams, matches in Round 1 (Preliminary):', knockoutMatches6.length); // Should be 2 (to get 4 teams: 2 winners + 2 byes)

console.log('6 teams -> 6-4 = 2 matches. Teams playing: 2*2 = 4. Byes: 6-4 = 2.');
console.log('Knockout Matches 6 Count:', knockoutMatches6.length === 2 ? 'PASS' : 'FAIL');
