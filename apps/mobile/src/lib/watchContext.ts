import { supabase } from './supabase';
import type { Episode, Title } from './types';

export type WatchContext = {
  title: Title;
  // Dizilerde sıralı bölüm listesi, filmlerde boş
  episodes: Episode[];
};

// Bir video kimliğinden ait olduğu filmi ya da diziyi ve bölümlerini bulur
export async function loadWatchContext(videoUid: string): Promise<WatchContext | null> {
  const { data: episode } = await supabase.from('episodes').select('title_id').eq('video_uid', videoUid).maybeSingle();

  if (episode) {
    const [{ data: title }, { data: episodes }] = await Promise.all([
      supabase.from('titles').select('*').eq('id', episode.title_id).single(),
      supabase.from('episodes').select('*').eq('title_id', episode.title_id).order('season').order('number'),
    ]);
    return title ? { title, episodes: episodes ?? [] } : null;
  }

  const { data: film } = await supabase.from('titles').select('*').eq('video_uid', videoUid).maybeSingle();
  return film ? { title: film, episodes: [] } : null;
}
