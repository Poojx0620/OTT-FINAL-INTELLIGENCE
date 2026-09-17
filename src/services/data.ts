import type { ViewerProfile } from '@/types';

// Parse the embedded CSV data
const CSV_DATA = `user_id,watch_time_hours,avg_session_mins,session_frequency,completion_rate,top_genres,genre_diversity,activity_level
U001,52,42,14,0.89,Action|Sci-Fi,0.42,high
U002,18,22,5,0.61,Comedy|Drama,0.38,low
U003,48,45,16,0.92,Sci-Fi|Thriller,0.35,high
U004,12,15,3,0.55,Comedy,0.22,low
U005,38,38,10,0.78,Action|Adventure,0.40,medium
U006,55,44,15,0.91,Sci-Fi|Action,0.38,high
U007,8,12,2,0.48,Comedy|Romance,0.30,low
U008,42,40,12,0.84,Action|Thriller,0.42,high
U009,22,25,6,0.65,Drama|Romance,0.35,medium
U010,35,36,9,0.76,Adventure|Action,0.38,medium
U011,50,43,14,0.88,Sci-Fi|Thriller|Action,0.48,high
U012,15,18,4,0.52,Comedy,0.20,low
U013,45,41,13,0.86,Action|Sci-Fi,0.40,high
U014,28,30,7,0.70,Drama|Thriller,0.35,medium
U015,6,10,2,0.45,Romance,0.18,low
U016,48,42,14,0.90,Sci-Fi|Action|Adventure,0.45,high
U017,20,24,5,0.62,Comedy|Drama,0.32,low
U018,40,38,11,0.82,Action|Thriller,0.40,high
U019,10,14,3,0.50,Comedy,0.22,low
U020,36,37,10,0.79,Adventure|Sci-Fi,0.38,medium
U021,53,44,15,0.90,Action|Sci-Fi,0.35,high
U022,16,20,4,0.58,Romance|Comedy,0.30,low
U023,44,40,12,0.85,Sci-Fi|Thriller,0.42,high
U024,30,32,8,0.72,Drama|Action,0.35,medium
U025,5,8,2,0.42,Comedy,0.15,low
U026,46,41,13,0.87,Action|Adventure|Sci-Fi,0.45,high
U027,24,28,6,0.66,Romance|Drama,0.32,medium
U028,38,38,10,0.80,Action|Thriller,0.38,high
U029,14,16,4,0.54,Comedy,0.22,low
U030,34,35,9,0.75,Adventure|Sci-Fi|Action,0.42,medium
U031,51,43,14,0.89,Sci-Fi|Action,0.35,high
U032,18,22,5,0.60,Comedy|Romance,0.28,low
U033,47,42,13,0.88,Action|Sci-Fi|Thriller,0.45,high
U034,26,29,7,0.68,Drama|Thriller,0.32,medium
U035,7,11,2,0.46,Romance,0.18,low
U036,42,39,11,0.83,Action|Adventure,0.38,high
U037,22,26,6,0.64,Comedy|Drama,0.30,low
U038,39,37,10,0.81,Sci-Fi|Thriller,0.40,high
U039,11,15,3,0.50,Comedy,0.20,low
U040,37,36,10,0.78,Adventure|Action,0.38,medium
U041,54,45,15,0.91,Sci-Fi|Action,0.35,high
U042,17,21,5,0.59,Romance|Comedy,0.28,low
U043,43,40,12,0.85,Action|Thriller|Sci-Fi,0.45,high
U044,29,31,8,0.71,Drama|Action,0.35,medium
U045,6,9,2,0.44,Comedy,0.15,low
U046,49,42,14,0.89,Action|Sci-Fi|Adventure,0.45,high
U047,23,27,6,0.65,Romance|Drama,0.30,medium
U048,41,38,11,0.82,Action|Thriller,0.38,high
U049,13,17,4,0.53,Comedy,0.20,low
U050,35,35,9,0.76,Adventure|Sci-Fi,0.38,medium
U051,50,43,14,0.88,Sci-Fi|Action,0.35,high
U052,19,23,5,0.61,Comedy|Romance,0.28,low
U053,45,41,13,0.86,Action|Sci-Fi|Thriller,0.42,high
U054,27,30,7,0.69,Drama|Thriller,0.32,medium
U055,8,12,2,0.47,Romance,0.18,low
U056,44,40,12,0.84,Action|Adventure|Sci-Fi,0.45,high
U057,25,28,7,0.67,Comedy|Drama,0.32,medium
U058,40,38,11,0.81,Sci-Fi|Thriller,0.40,high
U059,12,16,4,0.51,Comedy,0.20,low
U060,36,36,10,0.77,Adventure|Action,0.38,medium
U061,52,43,14,0.90,Sci-Fi|Action,0.35,high
U062,16,20,5,0.58,Romance|Comedy,0.28,low
U063,46,41,13,0.87,Action|Sci-Fi|Thriller,0.42,high
U064,28,31,8,0.70,Drama|Action,0.35,medium
U065,5,8,2,0.43,Comedy,0.15,low
U066,48,42,13,0.88,Action|Adventure|Sci-Fi,0.45,high
U067,21,25,6,0.63,Romance|Drama,0.30,medium
U068,39,37,10,0.80,Action|Thriller,0.38,high
U069,10,14,3,0.49,Comedy,0.20,low
U070,34,35,9,0.75,Adventure|Sci-Fi,0.38,medium
U071,53,44,15,0.91,Sci-Fi|Action,0.35,high
U072,18,22,5,0.60,Comedy|Romance,0.28,low
U073,44,40,12,0.85,Action|Sci-Fi|Thriller,0.42,high
U074,26,29,7,0.68,Drama|Thriller,0.32,medium
U075,7,11,2,0.46,Romance,0.18,low
U076,42,39,11,0.83,Action|Adventure,0.38,high
U077,22,26,6,0.64,Comedy|Drama,0.30,low
U078,38,37,10,0.79,Sci-Fi|Thriller,0.40,high
U079,11,15,3,0.50,Comedy,0.20,low
U080,37,36,10,0.78,Adventure|Action,0.38,medium
U081,51,42,14,0.89,Sci-Fi|Action,0.35,high
U082,15,19,4,0.57,Romance|Comedy,0.28,low
U083,47,42,13,0.88,Action|Sci-Fi|Thriller,0.45,high
U084,29,32,8,0.71,Drama|Action,0.35,medium
U085,6,10,2,0.45,Comedy,0.15,low
U086,45,41,13,0.86,Action|Adventure|Sci-Fi,0.45,high
U087,24,28,7,0.66,Romance|Drama,0.32,medium
U088,41,38,11,0.82,Action|Thriller,0.38,high
U089,13,17,4,0.52,Comedy,0.20,low
U090,35,36,9,0.77,Adventure|Sci-Fi,0.38,medium
U091,50,43,14,0.88,Sci-Fi|Action,0.35,high
U092,17,21,5,0.59,Comedy|Romance,0.28,low
U093,43,40,12,0.84,Action|Sci-Fi|Thriller,0.42,high
U094,27,30,7,0.69,Drama|Thriller,0.32,medium
U095,8,12,2,0.47,Romance,0.18,low
U096,46,41,13,0.87,Action|Adventure|Sci-Fi,0.45,high
U097,23,27,6,0.65,Comedy|Drama,0.30,medium
U098,40,38,11,0.81,Sci-Fi|Thriller,0.40,high
U099,12,16,4,0.51,Comedy,0.20,low
U100,36,36,10,0.76,Adventure|Action,0.38,medium`;

export function parseCSV(csv: string): ViewerProfile[] {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const profiles: ViewerProfile[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j];
    }
    profiles.push({
      user_id: row.user_id,
      watch_time_hours: parseFloat(row.watch_time_hours),
      avg_session_mins: parseFloat(row.avg_session_mins),
      session_frequency: parseInt(row.session_frequency),
      completion_rate: parseFloat(row.completion_rate),
      top_genres: row.top_genres.split('|'),
      genre_diversity: parseFloat(row.genre_diversity),
      activity_level: row.activity_level,
    });
  }
  return profiles;
}

export function loadViewerData(): ViewerProfile[] {
  return parseCSV(CSV_DATA);
}

export function searchViewers(query: string, data: ViewerProfile[]): ViewerProfile[] {
  const q = query.toLowerCase();
  return data.filter((v) => v.user_id.toLowerCase().includes(q));
}
