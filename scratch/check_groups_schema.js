
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkGroups() {
  console.log('Checking tournament_groups table...')
  const { data, error } = await supabase
    .from('tournament_groups')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error fetching tournament_groups:', error.message)
    if (error.message.includes('does not exist')) {
      console.log('TABLE DOES NOT EXIST. Please run the migration.')
    }
  } else {
    console.log('Table exists. Sample row:', data)
  }

  console.log('\nChecking relationship via join...')
  const { data: joinData, error: joinError } = await supabase
    .from('tournaments')
    .select('id, groups:tournament_groups(*)')
    .limit(1)

  if (joinError) {
    console.error('Join error:', joinError.message)
  } else {
    console.log('Join successful!')
  }
}

checkGroups()
