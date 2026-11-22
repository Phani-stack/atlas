import type {
  LearningSpace,
  Roadmap,
  TutorHistoryEntry,
  TutorQuestion,
  TutorStatus,
} from "../types";

export interface ExtendedResource {
  id: number;
  title: string;
  url: string;
  type: string;
  source: string;
  domain: string;
  summary: string;
  difficulty: string;
  stage: string;
  estimated_minutes: number;
  pages: number | null;
  downloaded: boolean;
  moduleId: string;
  readingStatus: "to_read" | "reading" | "done";
  notes?: string;
}

export interface ReviewCard {
  id: string;
  spaceId: string;
  spaceName: string;
  concept: string;
  prompt: string;
  answer: string;
  intervalDays: number;
  repetition: number;
  dueToday: boolean;
  sourceReference: string;
}

export const sampleResources: ExtendedResource[] = [
  {
    id: 101,
    title: "RFC 793: Transmission Control Protocol Specification",
    url: "https://datatracker.ietf.org/doc/html/rfc793",
    type: "paper",
    source: "IETF",
    domain: "ietf.org",
    summary: "The canonical formal specification of TCP connection states, three-way handshake, sliding window mechanism, and packet header format.",
    difficulty: "intermediate",
    stage: "core",
    estimated_minutes: 90,
    pages: 85,
    downloaded: true,
    moduleId: "2.2",
    readingStatus: "done",
    notes: "Review Section 3.1 for sequence number wraparound and Section 3.8 for retransmission timeouts.",
  },
  {
    id: 102,
    title: "Congestion Avoidance and Control (Van Jacobson & Michael J. Karels)",
    url: "https://ee.lbl.gov/papers/congavoid.pdf",
    type: "paper",
    source: "SIGCOMM '88",
    domain: "ee.lbl.gov",
    summary: "Foundational paper that introduced Slow-Start, Congestion Avoidance, Fast Retransmit, and RTT variance estimation into modern TCP.",
    difficulty: "advanced",
    stage: "core",
    estimated_minutes: 60,
    pages: 18,
    downloaded: true,
    moduleId: "2.2",
    readingStatus: "reading",
    notes: "Van Jacobson's packet conservation principle: no new packet injected until an old packet leaves the pipe.",
  },
  {
    id: 103,
    title: "Computer Networks: A Systems Approach — End-to-End Protocols",
    url: "https://book.systemsapproach.net/e2e/tcp.html",
    type: "book",
    source: "Peterson & Davie",
    domain: "systemsapproach.net",
    summary: "Comprehensive open-access textbook chapter explaining sliding windows, flow control vs. congestion control, and TCP header nuances.",
    difficulty: "intermediate",
    stage: "core",
    estimated_minutes: 55,
    pages: 42,
    downloaded: true,
    moduleId: "2.2",
    readingStatus: "done",
    notes: "Crucial diagram on sliding window pointer math (LastByteAcked, LastByteSent, LastByteWritten).",
  },
  {
    id: 104,
    title: "MIT 6.829: Computer Networks Lecture 4 — TCP Congestion Control",
    url: "https://ocw.mit.edu/courses/6-829-computer-networks-fall-2002/lecture-notes/",
    type: "doc",
    source: "MIT OpenCourseWare",
    domain: "ocw.mit.edu",
    summary: "Rigorous mathematical treatment of additive increase multiplicative decrease (AIMD), queue oscillation, and fairness equilibria.",
    difficulty: "advanced",
    stage: "core",
    estimated_minutes: 45,
    pages: 28,
    downloaded: true,
    moduleId: "2.2",
    readingStatus: "to_read",
    notes: "",
  },
  {
    id: 105,
    title: "RFC 6582: The NewReno Modification to TCP's Fast Recovery Algorithm",
    url: "https://datatracker.ietf.org/doc/html/rfc6582",
    type: "paper",
    source: "IETF Standards",
    domain: "ietf.org",
    summary: "Defines how TCP recovers from multiple dropped packets in a single window without waiting for slow RTO timeout.",
    difficulty: "intermediate",
    stage: "core",
    estimated_minutes: 35,
    pages: 16,
    downloaded: false,
    moduleId: "2.3",
    readingStatus: "to_read",
    notes: "",
  },
  {
    id: 106,
    title: "Packet Inspection & WireShark Analysis: TCP Handshake & Teardown",
    url: "https://wireshark.org/docs/tcp-analysis",
    type: "video",
    source: "Wireshark Labs",
    domain: "wireshark.org",
    summary: "Visual walk-through of SYN, SYN-ACK, ACK exchanges, selective acknowledgements (SACK), and TCP RST packets.",
    difficulty: "introductory",
    stage: "foundation",
    estimated_minutes: 30,
    pages: null,
    downloaded: false,
    moduleId: "2.1",
    readingStatus: "done",
    notes: "Handy capture filters for TCP RST and duplicate ACKs.",
  },
];

export const sampleRoadmap: Roadmap = {
  topic: "Computer Networks",
  learner: {
    known: "Basic Python, OS socket API concepts",
    goal: "Master transport protocols, congestion control, and packet architecture for high-throughput distributed systems",
    level: "intermediate",
  },
  generated_at: "2026-11-20T10:00:00Z",
  mode: "llm",
  overview: "A rigorous, systems-oriented route through network architecture. Starting from framing and link layers, progressing to the mechanics of reliable transport (TCP state machines, AIMD, flow control), and culminating in modern distributed application protocols.",
  total_estimated_hours: 80,
  assumed_hours_per_week: 10,
  estimated_weeks: 8,
  schedule: [
    { phase: 1, title: "Foundations & Link Layer", weeks: "1-2" },
    { phase: 2, title: "Internetworking & Transport", weeks: "3-5" },
    { phase: 3, title: "Application Layer & Distributed Scale", weeks: "6-8" },
  ],
  phases: [
    {
      phase: 1,
      title: "Foundations & Link Layer",
      objective: "Understand physical framing, Ethernet standards, MAC addressing, and ARP resolution.",
      stage: "foundation",
      estimated_hours: 20,
      modules: [
        {
          module_id: "1.1",
          title: "Framing & Error Detection",
          objectives: [
            "Explain byte-stuffing and bit-stuffing framing methods.",
            "Implement CRC-32 cyclic redundancy check and checksum computation.",
          ],
          concepts: ["Bit stuffing", "CRC-32", "Hamming distance"],
          resources: {
            primary: [
              {
                id: 106,
                title: "Ethernet Framing & WireShark Analysis",
                url: "https://wireshark.org/docs/tcp-analysis",
                type: "video",
                difficulty: "introductory",
                estimated_minutes: 30,
                downloaded: true,
              },
            ],
            supplementary: [],
          },
          practice: ["Write a Python script computing CRC-32 on an Ethernet payload"],
          checkpoint: "Verify zero undetected bit errors across simulated noisy channel",
          estimated_hours: 8,
          needs_external_resources: false,
        },
        {
          module_id: "1.2",
          title: "Ethernet Switching & ARP Resolution",
          objectives: [
            "Trace ARP request broadcast and unicast reply sequence.",
            "Explain MAC learning tables and switch spanning tree protocol (STP).",
          ],
          concepts: ["ARP Cache", "Broadcast Domains", "STP"],
          resources: { primary: [], supplementary: [] },
          practice: ["Simulate switch forwarding table aging in Python"],
          checkpoint: "Explain how broadcast storms are averted by STP",
          estimated_hours: 12,
          needs_external_resources: false,
        },
      ],
    },
    {
      phase: 2,
      title: "Internetworking & Transport Protocols",
      objective: "Master IP packet routing, subnet masks, TCP connection lifecycle, sliding windows, and congestion control algorithms.",
      stage: "core",
      estimated_hours: 35,
      modules: [
        {
          module_id: "2.1",
          title: "IPv4 / IPv6 Subnetting & CIDR",
          objectives: [
            "Perform CIDR prefix aggregation and longest-prefix-match lookup.",
            "Distinguish private subnet RFC 1918 allocations and NAT port forwarding.",
          ],
          concepts: ["CIDR", "Longest Prefix Match", "NAT", "IPv6 Neighbor Discovery"],
          resources: { primary: [], supplementary: [] },
          practice: ["Implement trie-based IP routing table lookup"],
          checkpoint: "Subnet a /20 block into three /24 and two /25 networks with zero overlap",
          estimated_hours: 10,
          needs_external_resources: false,
        },
        {
          module_id: "2.2",
          title: "TCP Congestion Control & Flow Control",
          objectives: [
            "Derive TCP throughput using the Mathis formula: Throughput <= (MSS / RTT) * sqrt(1.5 / p).",
            "Trace cwnd growth through Slow Start, Congestion Avoidance (AIMD), and Fast Recovery.",
            "Contrast TCP Tahoe, Reno, NewReno, and BBR pacing mechanisms.",
          ],
          concepts: [
            "Slow Start",
            "AIMD",
            "Fast Retransmit",
            "Advertised Window",
            "Ssthresh",
            "BBR Bottleneck Bandwidth",
          ],
          resources: {
            primary: [
              {
                id: 101,
                title: "RFC 793: Transmission Control Protocol Specification",
                url: "https://datatracker.ietf.org/doc/html/rfc793",
                type: "paper",
                difficulty: "intermediate",
                estimated_minutes: 90,
                downloaded: true,
                why: "Core reference for sequence number arithmetic and state machine transitions.",
              },
              {
                id: 102,
                title: "Congestion Avoidance and Control (Van Jacobson)",
                url: "https://ee.lbl.gov/papers/congavoid.pdf",
                type: "paper",
                difficulty: "advanced",
                estimated_minutes: 60,
                downloaded: true,
                why: "Original paper introducing Slow Start, Fast Recovery, and AIMD.",
              },
            ],
            supplementary: [
              {
                id: 103,
                title: "Peterson & Davie: End-to-End Protocols",
                url: "https://book.systemsapproach.net/e2e/tcp.html",
                type: "book",
                difficulty: "intermediate",
                estimated_minutes: 55,
                downloaded: true,
              },
            ],
          },
          practice: [
            "Calculate cwnd progression across 10 RTTs with initial cwnd=1 MSS and ssthresh=16 MSS",
            "Explain why 3 duplicate ACKs trigger Fast Retransmit instead of 1 or 2",
          ],
          checkpoint: "Correctly explain why TCP Reno halves cwnd upon 3 duplicate ACKs while Tahoe drops cwnd to 1 MSS",
          estimated_hours: 15,
          needs_external_resources: false,
        },
        {
          module_id: "2.3",
          title: "Reliable Sliding Windows & SACK",
          objectives: [
            "Implement sliding sender and receiver window buffers.",
            "Understand Selective Acknowledgements (RFC 2018) for multiple loss events.",
          ],
          concepts: ["Sliding Window", "SACK Blocks", "Cumulative ACK", "Nagle Algorithm"],
          resources: {
            primary: [
              {
                id: 105,
                title: "RFC 6582: NewReno Fast Recovery Algorithm",
                url: "https://datatracker.ietf.org/doc/html/rfc6582",
                type: "paper",
                difficulty: "intermediate",
                estimated_minutes: 35,
                downloaded: false,
              },
            ],
            supplementary: [],
          },
          practice: ["Build a Go-Back-N packet simulator handling dropped frames"],
          checkpoint: "Demonstrate window sliding after out-of-order buffer reassembly",
          estimated_hours: 10,
          needs_external_resources: false,
        },
      ],
    },
    {
      phase: 3,
      title: "Application Layer & Distributed Scale",
      objective: "Build high-throughput systems using HTTP/2 multiplexing, gRPC, and understand BGP routing.",
      stage: "advanced",
      estimated_hours: 25,
      modules: [
        {
          module_id: "3.1",
          title: "HTTP/2, HTTP/3 (QUIC) & Transport Evolution",
          objectives: [
            "Explain head-of-line blocking in HTTP/1.1 vs HTTP/2 vs HTTP/3 over QUIC/UDP.",
            "Analyze 0-RTT connection resumption and TLS 1.3 handshake integration.",
          ],
          concepts: ["QUIC", "HTTP/2 Multiplexing", "Head-of-Line Blocking", "TLS 1.3"],
          resources: { primary: [], supplementary: [] },
          practice: ["Profile latency difference between HTTP/1.1 pipelining and HTTP/2 multiplexing"],
          checkpoint: "Explain how UDP-based QUIC solves TCP-level head-of-line blocking",
          estimated_hours: 12,
          needs_external_resources: false,
        },
        {
          module_id: "3.2",
          title: "BGP Inter-Domain Routing & DNS Architecture",
          objectives: [
            "Explain BGP path vector mechanics, AS-path prepending, and peering relationships.",
            "Analyze recursive vs. iterative DNS resolution and Anycast routing.",
          ],
          concepts: ["BGP", "Autonomous Systems", "Anycast", "DNS Root Servers"],
          resources: { primary: [], supplementary: [] },
          practice: ["Trace Anycast routing divergence using traceroute from multiple geo-locations"],
          checkpoint: "Describe BGP route flapping and route damping remedies",
          estimated_hours: 13,
          needs_external_resources: true,
        },
      ],
    },
  ],
  capstone_project: {
    title: "Userspace Reliable UDP Transport Protocol with Sliding Window & AIMD",
    description: "Design and implement a userspace transport protocol on top of raw UDP sockets. It must feature connection establishment (SYN/ACK), dynamic RTT estimation using Jacobson's algorithm, sliding window packet buffering, Fast Retransmit on 3 duplicate ACKs, and AIMD congestion control. Test it against simulated packet loss, delay, and reordering proxies.",
    skills_used: [
      "Socket Programming",
      "Jacobson's RTT Estimation",
      "AIMD Congestion Control",
      "Packet Header Serialization",
      "Sliding Window Buffer Management",
    ],
  },
  gaps_to_fill: [
    {
      topic: "BGP Route Convergence under Path Flapping",
      why: "Requires specialized routing topology simulators (such as FRRouting or GNS3) and RFC 4271.",
      search_queries: [
        "BGP route flap damping RFC 2439 implementation",
        "Inter-domain routing simulation FRRouting lab guide",
      ],
    },
  ],
};

export const sampleLearningSpace: LearningSpace = {
  id: "space-networks-001",
  name: "Computer Networks",
  topic: "Computer Networks",
  known: "Basic Python, OS socket API concepts",
  goal: "Master transport protocols, congestion control, and packet architecture for high-throughput distributed systems",
  hours_per_week: 10,
  status: "ready",
  created_at: "2026-11-20T10:00:00Z",
  updated_at: "2026-11-22T08:30:00Z",
  resources: {
    topic: "Computer Networks",
    learner: sampleRoadmap.learner,
    generated_at: "2026-11-20T10:00:00Z",
    stats: {
      total: 18,
      downloaded: 14,
      by_type: { paper: 7, book: 4, doc: 4, video: 3 },
      by_difficulty: { introductory: 3, intermediate: 9, advanced: 6 },
      by_stage: { foundation: 4, core: 10, advanced: 4 },
    },
    roadmap_context: {
      brief: "Focus on protocol mechanics, state diagrams, and packet-level tradeoffs.",
      coverage_gaps: ["BGP Route Convergence under Path Flapping"],
    },
    resources: sampleResources as any,
  },
  roadmap: sampleRoadmap,
};

export const sampleQuestions: TutorQuestion[] = [
  {
    id: "q-mcq-01",
    module_id: "2.2",
    module_title: "TCP Congestion Control & Flow Control",
    concept: "TCP Slow Start & Ssthresh Transition",
    type: "mcq",
    difficulty: 3,
    review: false,
    title: "Congestion Window Growth Transition",
    prompt:
      "A TCP Reno sender experiences a slow-start phase where cwnd starts at 1 MSS and ssthresh is initially set to 16 MSS. Assuming every packet is immediately acknowledged with no packet loss, what happens at the exact point when cwnd reaches ssthresh?",
    options: [
      "TCP immediately drops cwnd to 1 MSS and resets ssthresh to cwnd / 2.",
      "TCP switches from exponential growth to linear growth (AIMD), increasing cwnd by approximately 1 MSS per RTT.",
      "TCP halts transmission for one RTO period before beginning congestion avoidance.",
      "TCP doubles cwnd every RTT until receiving an explicit ECN congestion notification.",
    ],
    hints_available: 2,
    sources: [
      {
        title: "Van Jacobson: Congestion Avoidance and Control (1988)",
        where: "Section 2.1 — Slow-start Threshold Mechanics",
        url: "https://ee.lbl.gov/papers/congavoid.pdf",
        resource_id: 102,
      },
      {
        title: "Peterson & Davie: End-to-End Protocols",
        where: "Chapter 6.3 — Additive Increase / Multiplicative Decrease",
        url: "https://book.systemsapproach.net/e2e/tcp.html",
        resource_id: 103,
      },
    ],
  },
  {
    id: "q-short-02",
    module_id: "2.2",
    module_title: "TCP Congestion Control & Flow Control",
    concept: "Fast Retransmit & 3 Duplicate ACKs",
    type: "short",
    difficulty: 3,
    review: true,
    title: "Rationale for the Three Duplicate ACKs Threshold",
    prompt:
      "Explain why TCP Fast Retransmit requires three duplicate ACKs (4 identical ACKs total) before concluding that a packet has been dropped, rather than retransmitting immediately upon the first duplicate ACK. What network condition does this threshold guard against?",
    hints_available: 2,
    sources: [
      {
        title: "RFC 793: Transmission Control Protocol Specification",
        where: "Section 3.7 — Retransmission and SACK",
        url: "https://datatracker.ietf.org/doc/html/rfc793",
        resource_id: 101,
      },
    ],
  },
  {
    id: "q-code-03",
    module_id: "2.2",
    module_title: "TCP Congestion Control & Flow Control",
    concept: "Sliding Window Receiver Buffer Validator",
    type: "code",
    difficulty: 4,
    review: false,
    title: "Packet In-Window Verification",
    prompt:
      "Write a function `is_packet_acceptable(window_start: int, window_size: int, seq_num: int) -> bool` that verifies whether an incoming packet sequence number lies strictly within the current receiver's advertised window. Note that sequence numbers are 32-bit unsigned integers [0, 2^32 - 1] and can wrap around.",
    code: {
      fn: "is_packet_acceptable",
      starter: `def is_packet_acceptable(window_start: int, window_size: int, seq_num: int) -> bool:
    """
    Check if seq_num is within [window_start, window_start + window_size).
    Handle 32-bit unsigned integer wraparound (MOD = 2**32).
    """
    MOD = 2**32
    # Write your solution below:
    pass
`,
      examples: [
        { args: [1000, 500, 1200], expected: true },
        { args: [1000, 500, 1600], expected: false },
        { args: [4294967200, 200, 50], expected: true },
      ],
    },
    hints_available: 1,
    sources: [
      {
        title: "RFC 793: Sequence Number Arithmetic",
        where: "Section 3.3 — Sequence Numbers and Wraparound",
        url: "https://datatracker.ietf.org/doc/html/rfc793",
        resource_id: 101,
      },
    ],
  },
];

export const sampleHistoryEntries: TutorHistoryEntry[] = [
  {
    id: "hist-01",
    number: 1,
    module_id: "1.1",
    concept: "CRC-32 Polynomial Division",
    type: "short",
    question: "How does CRC-32 guarantee detection of all single-bit and double-bit errors?",
    answer: "Because the generator polynomial has degree 32 and includes (x+1) as a factor.",
    score: 0.95,
    verdict: "Correct",
    timestamp: "2026-11-20T14:22:00Z",
    difficulty: 2,
    hints: 0,
    review: false,
  },
  {
    id: "hist-02",
    number: 2,
    module_id: "1.2",
    concept: "ARP Spoofing Mitigation",
    type: "mcq",
    question: "Which switch feature intercepts ARP packets on untrusted ports to prevent poisoning?",
    answer: "Dynamic ARP Inspection (DAI)",
    score: 1.0,
    verdict: "Correct",
    timestamp: "2026-11-21T09:15:00Z",
    difficulty: 2,
    hints: 0,
    review: false,
  },
  {
    id: "hist-03",
    number: 3,
    module_id: "2.1",
    concept: "CIDR Prefix Matching",
    type: "problem",
    question: "Given a packet for destination 198.51.100.73, match against routing table entries.",
    answer: "Matches 198.51.100.64/26 via longest prefix match over 198.51.100.0/24.",
    score: 1.0,
    verdict: "Correct",
    timestamp: "2026-11-21T16:40:00Z",
    difficulty: 3,
    hints: 1,
    review: false,
  },
  {
    id: "hist-04",
    number: 4,
    module_id: "2.2",
    concept: "AIMD Multiplicative Decrease Factor",
    type: "mcq",
    question: "What is the mathematical justification for selecting decrease factor = 0.5 in AIMD?",
    answer: "It converges fastest to efficiency without starving newly added flows.",
    score: 0.55,
    verdict: "Review",
    timestamp: "2026-11-22T08:12:00Z",
    difficulty: 4,
    hints: 1,
    review: true,
  },
];

export const sampleTutorStatus: TutorStatus = {
  topic: "Computer Networks",
  difficulty: 3,
  stats: {
    streak: 14,
    best_streak: 21,
    xp: 480,
    answered: 18,
  },
  modules: [
    {
      module_id: "1.1",
      title: "Framing & Error Detection",
      phase: "Phase 1",
      status: "done",
      mastery: 1.0,
      asked: 4,
      gaps: false,
      weak: [],
    },
    {
      module_id: "1.2",
      title: "Ethernet Switching & ARP Resolution",
      phase: "Phase 1",
      status: "done",
      mastery: 0.95,
      asked: 5,
      gaps: false,
      weak: [],
    },
    {
      module_id: "2.1",
      title: "IPv4 / IPv6 Subnetting & CIDR",
      phase: "Phase 2",
      status: "done",
      mastery: 0.9,
      asked: 4,
      gaps: false,
      weak: [],
    },
    {
      module_id: "2.2",
      title: "TCP Congestion Control & Flow Control",
      phase: "Phase 2",
      status: "active",
      mastery: 0.65,
      asked: 5,
      gaps: true,
      weak: ["AIMD Slope Calculation", "Ssthresh Reset Behavior"],
    },
    {
      module_id: "2.3",
      title: "Reliable Sliding Windows & SACK",
      phase: "Phase 2",
      status: "locked",
      mastery: 0.0,
      asked: 0,
      gaps: false,
      weak: [],
    },
    {
      module_id: "3.1",
      title: "HTTP/2, QUIC & Transport Evolution",
      phase: "Phase 3",
      status: "locked",
      mastery: 0.0,
      asked: 0,
      gaps: false,
      weak: [],
    },
    {
      module_id: "3.2",
      title: "BGP Inter-Domain Routing",
      phase: "Phase 3",
      status: "locked",
      mastery: 0.0,
      asked: 0,
      gaps: false,
      weak: [],
    },
  ],
  history: sampleHistoryEntries,
  done: 3,
  total: 7,
};

export const sampleReviewCards: ReviewCard[] = [
  {
    id: "card-01",
    spaceId: "space-networks-001",
    spaceName: "Computer Networks",
    concept: "End-to-End Principle",
    prompt: "What is the core tenet of Saltzer, Reed, and Clark's End-to-End Argument in system design?",
    answer: "Functions placed at low levels of a system may be redundant or of little value when compared with the cost of providing them at that low level; correctness can only be completely and correctly implemented with the knowledge and help of the application standing at the endpoints.",
    intervalDays: 3,
    repetition: 4,
    dueToday: true,
    sourceReference: "Saltzer, Reed, Clark (1984) — End-to-End Arguments in System Design",
  },
  {
    id: "card-02",
    spaceId: "space-networks-001",
    spaceName: "Computer Networks",
    concept: "TCP Reno vs. Tahoe Loss Recovery",
    prompt: "How do TCP Reno and TCP Tahoe differ when detecting packet loss via three duplicate ACKs?",
    answer: "Tahoe cuts ssthresh to cwnd/2 and resets cwnd to 1 MSS (entering Slow Start). Reno cuts ssthresh to cwnd/2, sets cwnd to ssthresh + 3 MSS, and enters Fast Recovery without dropping back to 1 MSS.",
    intervalDays: 2,
    repetition: 2,
    dueToday: true,
    sourceReference: "Peterson & Davie Section 6.3 / RFC 2581",
  },
  {
    id: "card-03",
    spaceId: "space-networks-001",
    spaceName: "Computer Networks",
    concept: "BGP Split-Horizon Rule",
    prompt: "Why does Internal BGP (iBGP) prohibit an autonomous system router from advertising an iBGP-learned route to another iBGP peer?",
    answer: "To prevent routing loops within an AS, because iBGP does not update the AS-PATH attribute when advertising routes internally. Full-mesh iBGP or Route Reflectors are used instead.",
    intervalDays: 5,
    repetition: 3,
    dueToday: true,
    sourceReference: "RFC 4271 — Border Gateway Protocol 4",
  },
  {
    id: "card-04",
    spaceId: "space-dist-002",
    spaceName: "Distributed Systems",
    concept: "CAP Theorem Tradeoffs",
    prompt: "In Brewer's CAP Theorem, why is true 'CA' (Consistency + Availability) impossible in a real-world network partition?",
    answer: "Because network partitions (P) are an inherent physical reality of distributed networks. When a partition occurs, a system must either reject writes to guarantee consistency (CP) or accept writes risking diverging replicas (AP).",
    intervalDays: 1,
    repetition: 1,
    dueToday: true,
    sourceReference: "Gilbert & Lynch (2002) — Brewer's Conjecture and the Feasibility of Consistent, Available, Partition-Tolerant Web Services",
  },
  {
    id: "card-05",
    spaceId: "space-dist-002",
    spaceName: "Distributed Systems",
    concept: "Raft Log Compaction",
    prompt: "How does the Raft consensus protocol prevent its append-only command log from growing unbounded over time?",
    answer: "Via periodic state machine Snapshotting: the node writes its complete current state to stable storage and discards all log entries up to the snapshot index.",
    intervalDays: 4,
    repetition: 2,
    dueToday: true,
    sourceReference: "Ongaro & Ousterhout (2014) — In Search of an Understandable Consensus Algorithm",
  },
];

export const sampleSpacesList = [
  {
    id: "space-networks-001",
    name: "Computer Networks",
    topic: "Computer Networks",
    status: "ready" as const,
    hours_per_week: 10,
    created_at: "2026-11-20T10:00:00Z",
    updated_at: "2026-11-22T08:30:00Z",
    progress: 43,
    activeModule: "2.2 TCP Congestion Control & Flow Control",
  },
  {
    id: "space-dist-002",
    name: "Distributed Systems",
    topic: "Distributed Systems",
    status: "ready" as const,
    hours_per_week: 8,
    created_at: "2026-11-15T12:00:00Z",
    updated_at: "2026-11-21T18:00:00Z",
    progress: 68,
    activeModule: "4.1 Raft Leader Election & Log Replication",
  },
  {
    id: "space-db-003",
    name: "Database Internals",
    topic: "Database Storage Engines & Query Execution",
    status: "building" as const,
    hours_per_week: 6,
    created_at: "2026-11-22T11:00:00Z",
    updated_at: "2026-11-22T11:00:00Z",
    progress: 0,
    activeModule: "Synthesizing research...",
  },
];
