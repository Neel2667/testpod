import type { DialogueLine } from '../types';

export const TRENDING_TOPICS = [
  'The Simulation Hypothesis: Is Our Universe a Computer Program?',
  'Project MKUltra: CIA Mind Control Experiments Declassified',
  'The Dark Forest Theory: Why Aliens Stay Silent',
  'CRISPR Gene Editing: Playing God with Human DNA',
  'Quantum Consciousness: Does the Brain Use Quantum Physics?',
  'Operation Paperclip: Nazi Scientists in America',
  'The Fermi Paradox and The Zoo Hypothesis',
  'Neuralink and The Merge: Humanity\'s Next Evolution',
  'The Library of Alexandria: What Knowledge Was Lost Forever',
  'Digital Surveillance State: How Your Data Controls You',
  'Ancient Advanced Civilizations Before Recorded History',
  'Artificial General Intelligence: The Last Invention Humanity Will Make',
];

export function getRandomTopic(): string {
  return TRENDING_TOPICS[Math.floor(Math.random() * TRENDING_TOPICS.length)];
}

const GUESTS = [
  { name: 'Dr. Vasquez', full: 'Dr. Elena Vasquez' },
  { name: 'Prof. Chen', full: 'Prof. Wei Chen' },
  { name: 'Dr. Okafor', full: 'Dr. Amara Okafor' },
  { name: 'Prof. Reinhardt', full: 'Prof. Klaus Reinhardt' },
  { name: 'Dr. Nakamura', full: 'Dr. Yuki Nakamura' },
  { name: 'Dr. Petrov', full: 'Dr. Alexei Petrov' },
  { name: 'Prof. Adeyemi', full: 'Prof. Folake Adeyemi' },
];

export function getRandomGuest() {
  return GUESTS[Math.floor(Math.random() * GUESTS.length)];
}

function entry(
  speaker: 'Host' | 'Guest',
  segment: number,
  text: string,
  ticker_text: string,
  info_card: string,
  center_visual: DialogueLine['center_visual'],
  duration: number,
): DialogueLine {
  return {
    id: crypto.randomUUID(),
    speaker,
    text,
    ticker_text,
    info_card,
    center_visual,
    segment,
    duration,
  };
}

export function generateMockScript(topic: string, guest?: { name: string; full: string }): DialogueLine[] {
  const g = guest ?? getRandomGuest();
  const guestName = g.name;

  const lines: DialogueLine[] = [
    // ───────────────── SEGMENT 2: EPISODE PROMO / HOOK ─────────────────
    entry(
      'Host',
      2,
      `Coming up on The Hidden Vault: we are opening the files on ${topic}. Are we looking at a genuine scientific breakthrough, or a carefully managed institutional diversion? Here is your first look.`,
      `COMING UP: Deep investigation into ${topic}`,
      `Tonight's File\n• Declassified information on ${topic}\n• Behind the official story\n• What they kept hidden`,
      {
        type: 'bullets',
        accent: 'blue',
        title: 'COMING UP',
        bullets: [
          'Declassified data on the record',
          'Institutional gatekeepers under fire',
          'The real story behind the public narrative',
        ],
      },
      14000,
    ),
    
    // ───────────────── SEGMENT 3: MAIN DISCUSSION ─────────────────
    entry(
      'Host',
      3,
      `Good evening. I'm Marcus Blackwell, and tonight we separate fact from fiction regarding ${topic}. To help us map the architecture of this subject, I'm joined by lead researcher ${guestName}. Welcome to the vault.`,
      `LIVE: Marcus Blackwell opens the investigation on ${topic}`,
      `The Hidden Vault\n• Host: Marcus Blackwell\n• Guest: ${guestName}\n• File: ${topic}`,
      {
        type: 'stat',
        accent: 'purple',
        title: 'Guest Profile',
        stat: {
          value: '15+',
          label: 'Years in Archival Research',
          sub: 'Analyzing declassified documents',
        },
      },
      15000,
    ),
    entry(
      'Guest',
      3,
      `Thank you, Marcus. What makes this subject so volatile is that the public is only given fragments of the picture. But when we look at the official timeline side-by-side with declassified records, the mismatch is undeniable.`,
      `Dr. Vasquez: Public gets fragments, but records show the mismatch`,
      `Evidence analysis\n• Fragments vs full picture\n• Mismatch in official timelines\n• Analyzing declassified logs`,
      {
        type: 'comparison',
        accent: 'orange',
        title: 'Narrative Contrast',
        comparison: {
          left: 'OFFICIAL STORY',
          leftLabel: 'Tidy and simple public version',
          right: 'DECLASSIFIED LOGS',
          rightLabel: 'Complex and highly sensitive internal data',
        },
      },
      16000,
    ),
    entry(
      'Host',
      3,
      `And that divergence is where the story gets uncomfortable. When the official output remains unchanged but the explanations keep mutating, it suggests the public version is being curated.`,
      `Host: Curated neatness is a signal of control`,
      `Curation Signals\n• Mutating explanations\n• Constant outputs\n• Controlled public awareness`,
      {
        type: 'quote',
        accent: 'red',
        title: 'Curation Principle',
        quote: {
          text: 'When a complicated subject is made to sound perfectly tidy, you should ask who tidied it.',
          author: 'Marcus Blackwell',
        },
      },
      14000,
    ),
    entry(
      'Guest',
      3,
      `Exactly. The institutional gatekeepers control funding, career safety, and publication. It is not that these findings failed scientifically; they failed to survive the political bottlenecks of the system.`,
      `Dr. Vasquez: Funding and publication bottlenecks restrict truth`,
      `System Bottlenecks\n• Funding allocation filters\n• Publication gatekeeping\n• Career risk boundaries`,
      {
        type: 'diagram',
        accent: 'green',
        title: 'Scientific Bottlenecks',
        bullets: [
          'Funding control directs research paths',
          'Gatekeeping controls legitimacy',
        ],
      },
      20000,
    ),
    // ───────────────── SEGMENT 4: OUTRO CREDITS ─────────────────
    entry(
      'Host',
      4,
      `That is all the time we have for tonight's file on ${topic}. I want to thank Dr. Vasquez for joining us and bringing these records to light. This episode was produced by the Vault Archival team.`,
      `CREDITS: Host Marcus Blackwell | Guest Dr. Elena Vasquez | Producer Vault Archival`,
      `Production Credits\n• Host: Marcus Blackwell\n• Research: Elena Vasquez\n• Executive Producer: Vault Team`,
      {
        type: 'bullets',
        accent: 'blue',
        title: 'PRODUCTION TEAM',
        bullets: [
          'Host & Writer: Marcus Blackwell',
          'Lead Researcher: Dr. Elena Vasquez',
          'Executive Producer: Vault Archival',
        ],
      },
      15000,
    ),
    // ───────────────── SEGMENT 5: END CHANNEL PROMO ─────────────────
    entry(
      'Host',
      5,
      `If you want to support independent investigation, hit subscribe and turn on notifications. Next week, we examine the classified files of Operation Paperclip. Don't let them lock the vault on you. Goodnight.`,
      `SUBSCRIBE: Support independent investigation | NEXT WEEK: Operation Paperclip`,
      `Channel Promo\n• Support the channel\n• Subscribe for updates\n• Next File: Operation Paperclip`,
      {
        type: 'bullets',
        accent: 'red',
        title: 'NEXT EPISODE',
        bullets: [
          'Title: Operation Paperclip',
          'Status: Scheduled',
          'Release: Next Thursday',
        ],
      },
      15000,
    ),
  ];

  return lines;
}
