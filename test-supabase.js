import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dbxerewphusfequsqthz.supabase.co';
const supabaseKey = 'sb_publishable_8hLBy1wLAbZQ-jeHrac-ag_FNg32_LK';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('movies').select('*');
  if (error) {
    console.error('ERROR:', error);
  } else {
    console.log('SUCCESS:', data);
  }
}

test();
