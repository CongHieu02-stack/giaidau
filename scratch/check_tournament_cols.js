
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkTournamentColumns() {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error.message)
  } else if (data.length > 0) {
    console.log('Columns in tournaments table:', Object.keys(data[0]))
  } else {
    console.log('No rows in tournaments table to check columns.')
  }
}

checkTournamentColumns()
