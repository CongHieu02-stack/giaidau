
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkMatchDefaults() {
  const { data, error } = await supabase
    .from('matches')
    .insert({ tournament_id: '00000000-0000-0000-0000-000000000000', home_club_id: '00000000-0000-0000-0000-000000000000', away_club_id: '00000000-0000-0000-0000-000000000000' })
    .select()
  
  if (error) {
    console.log('Error (expected if IDs invalid):', error.message)
    // Try to just select 
    const { data: selectData } = await supabase.from('matches').select('*').limit(1)
    console.log('Existing match sample:', selectData)
  } else {
    console.log('Inserted match sample:', data)
  }
}

checkMatchDefaults()
