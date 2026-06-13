import {
  Github,
  Linkedin,
  Mail,
  Sun,
  Moon,
  Copy,
  ArrowUp,
  Check,
  ExternalLink,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { LinkPreview } from "./components/ui/link-preview";

const mono = "'JetBrains Mono', 'Consolas', ui-monospace, monospace";
const script = "'Monsieur La Doulaise', cursive";
const sans = "'Geist', 'Inter', ui-sans-serif, system-ui, sans-serif";

type Project = {
  name: string;
  year: string;
  description: string;
  stack: string[];
  contribution: string;
  blogSlug: string;
  live?: string;
  source?: string;
  extraLinks?: { label: string; url: string }[];
};

type BlogPost = {
  slug: string;
  title: string;
  projectName: string;
  summary: string;
  content: string;
};

const blogPosts: BlogPost[] = [
  {
    slug: "insighta-profiles-api",
    title: "How I Designed and Shipped Insighta Profiles API",
    projectName: "Insighta Profiles API, Web Portal & CLI Tool",
    summary:
      "Architecture decisions, OAuth + PKCE implementation details, and what changed after scaling the API design.",
    content: `# Writeup Template: Insighta Profiles API

## 1. Quick Context
Write 3-5 lines on what you were building and why this project mattered.

## 2. Problem Statement
- What constraints did you have?
- What user or business problem were you solving?

## 3. Architecture Decisions
- Decision 1: why you chose it
- Decision 2: tradeoffs considered

## 4. Implementation Highlights
Describe key endpoints, modules, or flows you are proud of.

## 5. Challenges and Fixes
- Challenge
- How you debugged it
- Final fix

## 6. Outcomes
Share measurable impact or quality improvements.

## 7. Lessons Learned
What would you keep, change, or improve in v2?`,
  },
  {
    slug: "http-retry-engine",
    title: "Building a Retry Engine with Backoff, Jitter, and Dead Letters",
    projectName: "HTTP Retry Engine",
    summary:
      "Designing a robust retry loop, modeling attempt history, and handling failure states safely.",
    content: `# Writeup Template: HTTP Retry Engine

## 1. Goal
Explain what the retry engine needed to accomplish.

## 2. Failure Model
- Which status codes should retry?
- Which should fail permanently?

## 3. Core Design
- Worker loop and polling interval
- Attempt tracking strategy
- Dead-letter behavior

## 4. Backoff Strategy
Document your backoff formula and jitter approach.

## 5. API Surface
List key endpoints and why each one exists.

## 6. Testing and Validation
How did you verify correctness and reliability?

## 7. What I Learned
Summarize practical lessons from distributed systems behavior.`,
  },
  {
    slug: "skillbridge-api",
    title: "Fixing Real Production Pain in SkillBridge API",
    projectName: "SkillBridge API",
    summary:
      "From URL hallucination fixes to employer verification and assessment flow stability.",
    content: `# Writeup Template: SkillBridge API

## 1. Project Context
Briefly explain the team setup and the stage of the platform.

## 2. Key Issues I Tackled
- Issue A
- Issue B
- Issue C

## 3. Technical Deep Dive
Choose one issue and walk through your approach in detail.

## 4. Collaboration and PR Flow
Share how you coordinated changes across contributors.

## 5. Impact
What improved for employers, candidates, or system reliability?

## 6. Reflections
What this taught you about working in a large codebase.`,
  },
  {
    slug: "zubbee-scheduler",
    title: "The Highlight of my HNG Experience",
    projectName: "Zubbee Scheduler & SkillBridge API",
    summary:
      "A technical blog post reflecting on two key internship milestones: building the custom Zubbee background job scheduler and resolving production issues in the collaborative SkillBridge API.",
    content: `

During my time in the HNG internship, I worked on several challenging individual stages and collaborated on team projects. Out of all the tasks, two specific milestones stood out as the most technically demanding and rewarding: the Zubbee Scheduler (individual stage) and the SkillBridge API (team task). Here is the technical breakdown of both systems, what broke, and what I learned from them.


# Zubbee - Scheduler

## What it was
We were asked to build a background scheduler that is lightweight and self-contained with priority handling using a min heap, automatic retries, a dead-letter queue (DLQ) for failed tasks, DAG-based task dependency workflows, and a live monitoring dashboard.

## The problem it was solving
Production apps often need to process time-consuming asynchronous tasks (like sending notifications or parsing large files) without blocking the main event loop. While robust solutions like BullMQ exist, they require heavy external dependencies like Redis. A custom background scheduler can solve this by providing priority queuing, timing-wheel execution, and workflow orchestration for an internal developer team.

## How I approached it
My biggest strength, which I currently attribute to the system design task in stage 4, was understanding the requirements of a system and finding out the simplest way to approach it. A winning solution is a simple one. As said in this conversation with Bassem Dghaidi on Beyond Coding, “you can do a lot with very little.” He breaks down how to think about system design when real business impact is on the line. You can pause and check it out.

<iframe width="560" height="315" src="https://www.youtube.com/embed/LeUUxLRdvho?si=MwqhnlN-FA8XM8cd" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>


For me, approaching a problem, I ask what the requirements are and what the simplest system can be to fit those requirements. Having to do system design in stage 4, I designed my own approach to technical problems.

In my tribute to simplicity, I built this background scheduler on my already existing retry engine. Part of the requirements of this scheduler, the retry engine already did some of that, so I thought it made sense to just build on it, which cost me a little down the line.

Here are the requirements and how I implemented them.
1. **An alternative scheduling algorithm must be benchmarked against the heap and documented.** Among the choices given of Timing wheels, Indexed priority queues and Skip lists, I chose the timing wheel algorithm because it seemed like the most straightforward. I’d like to pretend like it was because of good system design principles, but I was on a short timeline so… I implemented the timing algorithm a bit differently, though. Although it was a scheduling algorithm, I included priority-based scheduling in its functionality so that it still worked the same way the heap does. That meant deciding where to place it in the timing wheel without having to compare it with every element as the heap does. After the benchmark test was done, surprised to say it was actually way faster to insert elements than the heap data structure. That was a big discovery.
2. **Duplication prevention. In a multiple-worker system, no two workers must pick a job at the same time.** In this case, I decided to use a simple lockedAt column on every job to indicate when a job has been started for processing, but this wasn’t a failsafe eventually. More on that later.
3. **Starvation prevention: Low-priority jobs should not wait forever while high-priority jobs keep jumping the queue. So the longer a job sits, the higher its effective priority becomes.** My approach was simply checking the time differences of each of the jobs first before comparing jobs by their created time by their priority, their scheduled time and their created time. If a job had stayed in the queue for more than 2 mins (my threshold) then it would be picked over the other job.
4. **DAG Workflow: The relationship between jobs must be a directional acyclic graph.** To keep this relationship, I created a table to store jobs and their dependencies. Each jobId had a job dependency id, and both were primary keys in the table, meaning that their relationship cannot be repeated.

## What broke and how I fixed it
My biggest issue was when I realised the database locking tradeoff of SQLite. SQLite by nature, prevents concurrent reads and writes on a database file such that one read operation blocks another write operation. This could cause problems because if both the Express API and the background worker were constantly querying and modifying the same SQLite database, they could repeatedly run into \`SQLITE_BUSY\` database lock errors under load.
My fix was to update the SQLite connection settings to enable Write-Ahead Logging (\`journal_mode=WAL\`). This allowed multiple processes to perform concurrent reads while a write transaction was active, eliminating lock contention.

However…

The issue wasn’t completely solved because although reads and writes can happen concurrently, two writes were still blocked at the same time, meaning a write to the database file blocks another write. This could lead to issues in the system.
I acknowledged this tradeoff and utilised it to create a failsafe duplicate prevention for my system. For the multiple-worker system, when a job of interest is queried from the database, it must be set to processing in one transaction, thereby preventing any reads to the database. That way, two workers would never read the same job, preventing duplicate actions on one job.
That leaves other issues like the Express server operations and bigger issues for 3-5 workers. I accepted this tradeoff to keep things simple in my system. It was the simplest and most efficient possible solution to the problem, which is good enough.

## What I took away from it
Building this taught me how scheduling data structures are designed from the ground up. I learned how to balance memory and time complexity (benchmarking heap vs. timing wheel) and how SQLite handles concurrency in real-world environments. It has introduced me to the concept of data structures and algorithms and how they translate to systems in our everyday products. I got to learn how to implement two of those, which was cool. Above all, I saw how following the simplest method helps make better products.

## Why I picked it
I chose this project because it forced me to implement core computer science data structures (like Heaps and circular Timing Wheels) instead of just relying on ready-made npm packages, teaching me the underlying mechanics of background workers. It was almost my most challenging and most fun because there were many moving parts that needed to be considered. Throughout every piece of the system, I thought about the requirements and how they all work together. If one piece fails, the others are more likely to.

---

# The SkillBridge API

## What it was
The backend API for SkillBridge, an AI-powered talent assessment and employer-candidate matching platform built collaboratively using NestJS, TypeScript, PostgreSQL, and TypeORM.

## The problem it was solving
The platform connects candidates and employers by running AI-driven skill assessments to validate the talent pool while giving employers an opportunity to find them through job postings, custom assessments and offers. However, the system had critical stability issues while we were building, and I contributed to fixing those issues while implementing new features. For example, the LLM frequently generated fake reference links (URL hallucinations) during the AI guidance report after assessments and when prompted to generate resource links for talent. Some of the features I built are the employer trust and verification layer to prevent unverified employers from initiating actions, and the employer-talent offer and shortlist feature, where talent can be shortlisted and sent an offer. Both receive notifications of activity related to the job offer.

## Some of my contributions: what broke and how I fixed it

I initially integrated resource links for the AI guidance layer for the completion result of advanced assessments and the general resources page independent of assessment results, but the generated resources from AI were usually hallucinated, and so most of the links were broken. To solve this issue, I built a validation service leveraging the YouTube Data API v3 and Serper.dev Google Search to check and filter AI-generated resources, swapping out hallucinated links. This was a non-breaking change that added a layer of verification to the AI-generated resources. For every title, description and link text generated, the title and description are used as a query to fetch data from either API depending on whether it was a video or not. Because the title and description were usually detailed, it mostly worked. Mostly. After many iterations, we came close to only 5% broken links compared to 95% before.

Another issue with the AI-generated resource links was the long wait times on the page, which were really bad for UX. I added configurable timeouts with background cache warming so that for any new change in the talent profile, such as completing onboarding or an assessment, the generation service is automatically triggered in the background and saved into the database so that when the user lands on the resource page, the page load is instant. This improved the overall customer experience. As previously stated, page load wait time moved from an average of 3 minutes to none.

I designed the employer verification pipeline, implementing SSRF-hardened reachability checks for company websites and LinkedIn verification gates to prevent unverified outreach to talent. Among many others were refactoring skill assessments to strict MCQ scoring to reduce the wait time that came from AI trying to score open text. Since we already had rubric scoring for the MCQ, assessment results became instant, going from about 3 mins previously. I standardised database question count schemas and.

## My grave lessons
Working on SkillBridge taught me how to collaborate effectively in a larger codebase. Enforcing API standards (response normalisation, snake_case conversion) and contributing 33+ pull requests reinforced my developer discipline. The complexity of working within a team. Resolving real-world security vulnerabilities, optimising performance, and handling LLM hallucination issues gave me a strong appreciation for defensive API design.
Thinking about how my new feature could break the product or make it was good paranoia. I also learnt more than just writing code. I learnt how to use AI-assisted programming in the best way to both meet the demands of my team in increasing my productivity and also learn. I was in the best balance of speed and growth. My biggest lesson was the understanding that people are the major thing in every product and not just the thing. I learnt how interactions and communication make or break a product. Without putting myself out there to take chances and contribute, I will never be a productive developer. I’m not that special, and nobody is going to pause their own business to ask for your contributions. They just value who gives it first. Not fair but who cares? Personally, this was the highlight of my HNG experience.

## Why I picked it
I picked these handful of tasks among many others because these were the times I thought about the product like my own. These were also times where I made the decisions without having to be told. I recently read an article that I agree with and changed my perspective on how to work in teams together on a product. The best engineers think about the product and they're not just there to be assigned tasks. They're involved in the decision process they attend all the meetings. They know what's happening across the other teams like marketing or finance. What are the numbers, what are the customer complaints? I decided to reach towards that during this internship and I have alot more to say about how it helps in the building process. Having an understanding of all the moving parts outside of just the code is what enabled me to think passionately about what the product needs. These were implementations 
that I wasn't asked to do simply because I tested the product and I invested my mind into solving as many issues as I could. I think that's the cheat code to being a builder others would like to work with. It made it easier to work and I'm going to keep applying this in other teams too. The ability to code with an understanding of all the moving parts is my highlight of this experience. I know I've said that already. Last time.

I think...
`,
  },
];

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const chunks = text.split(/(`[^`]+`)/g);
  return chunks.flatMap((chunk, idx) => {
    if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length >= 2) {
      const code = chunk.slice(1, -1);
      return (
        <code
          key={`code-${idx}`}
          className="px-1.5 py-0.5 rounded opacity-90"
          style={{
            fontFamily: mono,
            fontSize: "12px",
            backgroundColor: "rgba(127,127,127,0.15)",
          }}
        >
          {code}
        </code>
      );
    }

    // Split the plain text chunk by double asterisks for bolding
    const subChunks = chunk.split(/(\*\*[^*]+\*\*)/g);
    return subChunks.map((subChunk, subIdx) => {
      if (
        subChunk.startsWith("**") &&
        subChunk.endsWith("**") &&
        subChunk.length >= 4
      ) {
        const boldText = subChunk.slice(2, -2);
        return (
          <strong
            key={`bold-${idx}-${subIdx}`}
            style={{ fontWeight: 600 }}
            className="opacity-100"
          >
            {boldText}
          </strong>
        );
      }
      return <span key={`txt-${idx}-${subIdx}`}>{subChunk}</span>;
    });
  });
}

function renderMarkdownBlocks(content: string): React.ReactNode[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith("<iframe") || line.startsWith("[youtube](")) {
      let src = "";
      if (line.startsWith("<iframe")) {
        const srcMatch = line.match(/src="([^"]+)"/);
        src = srcMatch ? srcMatch[1] : "";
      } else {
        const srcMatch = line.match(/\[youtube\]\(([^)]+)\)/);
        src = srcMatch ? srcMatch[1] : "";
      }
      if (src) {
        blocks.push(
          <div
            key={`yt-${i}`}
            className="mt-6 aspect-video w-full rounded-xl overflow-hidden shadow-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5"
          >
            <iframe
              src={src}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>,
        );
        i += 1;
        continue;
      }
    }

    if (line === "---" || line === "***" || line === "___") {
      blocks.push(
        <hr
          key={`hr-${i}`}
          className="my-8 border-t border-black/10 dark:border-white/10"
        />,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push(
        <pre
          key={`pre-${i}`}
          className="mt-5 p-4 rounded overflow-x-auto"
          style={{
            fontFamily: mono,
            fontSize: "12px",
            backgroundColor: "rgba(127,127,127,0.12)",
          }}
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h4 key={`h4-${i}`} className="text-[18px] leading-[28px] pt-8">
          {line.slice(4)}
        </h4>,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push(
        <h3
          key={`h3-${i}`}
          className="text-[22px] leading-[32px] pt-10"
          style={{ letterSpacing: "-0.4px" }}
        >
          {line.slice(3)}
        </h3>,
      );
      i += 1;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(
        <h2
          key={`h2-${i}`}
          className="text-[30px] leading-[40px] pt-8"
          style={{ letterSpacing: "-0.8px", fontWeight: 500 }}
        >
          {line.slice(2)}
        </h2>,
      );
      i += 1;
      continue;
    }

    if (/^(-|\*)\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*(-|\*)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*(-|\*)\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ul
          key={`ul-${i}`}
          className="pt-4 pl-5 list-disc space-y-2 opacity-80"
        >
          {items.map((item, idx) => (
            <li key={`li-${idx}`} className="text-[15px] leading-[25px]">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      blocks.push(
        <ol
          key={`ol-${i}`}
          className="pt-4 pl-5 list-decimal space-y-2 opacity-80"
        >
          {items.map((item, idx) => (
            <li key={`oli-${idx}`} className="text-[15px] leading-[25px]">
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#|##|###)\s+/.test(lines[i].trim()) &&
      !/^\s*(-|\*)\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("<iframe") &&
      !lines[i].trim().startsWith("[youtube](") &&
      lines[i].trim() !== "---" &&
      lines[i].trim() !== "***" &&
      lines[i].trim() !== "___"
    ) {
      paragraphLines.push(lines[i].trim());
      i += 1;
    }

    blocks.push(
      <p
        key={`p-${i}`}
        className="opacity-75 text-[15px] leading-[26px] pt-5"
        style={{ fontWeight: 300 }}
      >
        {renderInlineMarkdown(paragraphLines.join(" "))}
      </p>,
    );
  }

  return blocks;
}

const projects: Project[] = [
  {
    name: "Insighta Profiles API, Web Portal & CLI Tool",
    year: "Apr 2026",
    description:
      "Full-stack profile management system with GitHub OAuth 2.0 + PKCE, natural language search, role-based access control, and a matching CLI tool.",
    stack: ["Node.js", "Express", "PostgreSQL", "Redis", "JWT"],
    contribution:
      "Architected and built the entire backend from scratch: designed the PostgreSQL schema for profiles and users, implemented GitHub OAuth 2.0 with PKCE (S256 challenge) for both web and CLI clients with HTTP-only cookie transport and Authorization header support respectively. Built role-based access control (admin/analyst separation), a rule-based NLP query parser that converts plain English like 'adult males from Kenya' into parameterised SQL by resolving country names via REST Countries API to ISO codes and mapping age keywords to numeric ranges. Added API versioning middleware (X-API-Version header enforcement), Redis-backed rate limiting (auth: 10/min, API: 60/min with IPv6 subnet grouping), token blacklisting on logout/refresh, transparent token auto-refresh for both web and CLI, admin CSV export, profile aggregation dashboard, and the full CLI tool with device-code auth flow. Integrated Genderize.io, Agify.io, and Nationalize.io for name classification.",
    blogSlug: "insighta-profiles-api",
    live: "https://ubiquitous-chainsaw-production-73a8.up.railway.app/",
    source: "https://github.com/Zubbee18/ubiquitous-chainsaw",
    extraLinks: [
      {
        label: "Web Portal",
        url: "https://github.com/Zubbee18/insighta-web-portal",
      },
      {
        label: "CLI Tool",
        url: "https://github.com/Zubbee18/insighta-cli-tool",
      },
    ],
  },
  {
    name: "HTTP Retry Engine",
    year: "May 2026",
    description:
      "Background retry service that handles failed HTTP requests with exponential backoff, jitter, dead-letter queuing, and full attempt history.",
    stack: ["Node.js", "Express", "SQLite"],
    contribution:
      "Implemented the full system from a given spec: a 500ms-interval polling worker that queries SQLite for pending/retrying jobs whose nextRetryAt has elapsed, executes the HTTP request, and routes the result based on status code. 2xx marks completed, 4xx marks permanently failed (no retry), 5xx triggers exponential backoff (backoffMs * 2^attempt * jitter where jitter is 0.8-1.2 per attempt to prevent thundering herd). When attemptCount exceeds configurable maxRetries (default 5), the job moves to failed status as a dead-letter. Every attempt is recorded in a separate attempts table with status and message for full auditability. Built the REST API: POST /request for job submission with URL/method/body validation, GET /requests/:id with joined attempt history, and GET /requests?status= for filtering. All DB mutations use SQLite transactions for atomicity.",
    blogSlug: "http-retry-engine",
    source: "https://github.com/Zubbee18/retry-engine",
  },
  {
    name: "SkillBridge API",
    year: "May 2026",
    description:
      "Backend for an AI-powered talent assessment and employer-candidate matching platform, built collaboratively during HNG Stage 8.",
    stack: ["NestJS", "TypeScript", "PostgreSQL", "TypeORM", "Swagger"],
    contribution:
      "Resolved AI-hallucinated broken resource URLs by building a UrlResolutionService that validates links via YouTube Data API v3 and Serper.dev Google Search, replacing fabricated URLs the LLM was generating. Built the full employer verification and trust layer: schema design, SSRF-hardened website reachability checks, LinkedIn validation, verification gates blocking unverified employers from sending offers or contacting candidates, hire-complete flow, and public employer profiles. Fixed skill assessment retake blocking, corrected question count mismatches across skill and advanced assessments, added configurable timeouts to all AI calls with background cache warming, served general learning resources pre-assessment, standardized all API responses to snake_case, and converted skill assessments to MCQ-only scoring. 23+ merged PRs total.",
    blogSlug: "skillbridge-api",
    source: "https://github.com/hngprojects/skill-bridge-api",
  },
  {
    name: "Zubbee Scheduler",
    year: "Jun 2026",
    description:
      "A background job scheduler with priority queuing, retries, dead-letter handling, and a live React dashboard for the Dilamme R&D Stage 9 challenge.",
    stack: ["Node.js", "SQLite", "React", "Vite"],
    contribution:
      "Built a scheduler that creates, queues, processes, and tracks jobs while workers run independently in the background. Added retry handling with a maximum of 3 attempts, dead-letter queue recovery, priority ordering, cancellation handling, DAG workflow support, starvation prevention, and a live React dashboard to inspect queue state.",
    blogSlug: "zubbee-scheduler",
    live: "https://zubbee-scheduler-fe.vercel.app",
    source: "https://github.com/Zubbee18/zubbee-scheduler",
  },
];

type AppView = "home" | "blog";

const getViewFromHash = (): { view: AppView; slug?: string } => {
  const hash = window.location.hash || "#/";
  if (hash.startsWith("#/blog")) {
    const parts = hash.split("/");
    const slug =
      parts.length >= 3 ? decodeURIComponent(parts[2] || "") : undefined;
    return { view: "blog", slug };
  }
  return { view: "home" };
};

const skills = [
  { name: "REST API Design", project: "Insighta" },
  { name: "System Design & Architecture", project: "Insighta, SkillBridge" },
  { name: "GitHub OAuth 2.0 + PKCE", project: "Insighta" },
  { name: "JWT Auth & Token Blacklisting", project: "Insighta, SkillBridge" },
  { name: "PostgreSQL & Schema Design", project: "Insighta, SkillBridge" },
  { name: "Redis (sessions, blacklist)", project: "Insighta" },
  { name: "External API Integration", project: "SkillBridge" },
  { name: "Background Jobs & Workers", project: "Retry Engine" },
  { name: "Exponential Backoff & Jitter", project: "Retry Engine" },
  { name: "NestJS + TypeScript", project: "SkillBridge" },
  { name: "Unit Testing", project: "SkillBridge" },
  { name: "Deployment (Railway)", project: "Insighta" },
  { name: "CLI Development", project: "Insighta CLI" },
];

const reflections = [
  {
    title: "Design the system before writing the code",
    body: "Early in HNG I'd jump straight to implementation. By the third iteration of the Insighta Profiles API I had the schema, request flow, caching strategy, and rate limiting designed upfront. That shift made the code cleaner and debugging far less painful.",
  },
  {
    title: "System design and implementation go hand in hand",
    body: "Before Insighta I would jump straight to code. Building the Profiles API for 2 million users forced me to think about schema design, request flow, caching strategy, and rate limiting before writing a single route. That upfront design work made the implementation faster and the system far more maintainable. I now treat architecture as part of the build, not a separate step.",
  },
  {
    title: "Backoff and jitter are not optional in distributed systems",
    body: "Building the retry engine made me understand thundering herd problems in practice. Doubling the delay per retry is obvious, but rolling fresh jitter per attempt, not once, is the subtlety I would have missed without working through it hands-on.",
  },
  {
    title: "Auth is the part you cannot get wrong",
    body: "Implementing GitHub OAuth with PKCE, HTTP-only cookies, Redis token blacklisting, and auto-refresh across both a web portal and a CLI taught me how many failure modes auth has. I think about session security very differently now.",
  },
  {
    title: "Working in a collaborative codebase teaches you discipline",
    body: "Contributing 30+ PRs to SkillBridge with other developers taught me how to write code that others can review and maintain: consistent naming conventions, clear PR descriptions, proper test coverage, and thinking about how my changes affect the rest of the system. I also learnt the importance of API contracts and how creating them enforces good API design practices and conventions.",
  },
];

function SocialIcon({
  children,
  href,
  label,
}: {
  children: React.ReactNode;
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="opacity-40 hover:opacity-100 transition-opacity duration-200"
    >
      {children}
    </a>
  );
}

export default function App() {
  const initialRoute = getViewFromHash();
  const [view, setView] = useState<AppView>(initialRoute.view);
  const [activeBlogSlug, setActiveBlogSlug] = useState<string | undefined>(
    initialRoute.slug,
  );
  const [dark, setDark] = useState(true);
  const [copied, setCopied] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const email = "deborahanyachukwunz@gmail.com";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    const syncHashRoute = () => {
      const route = getViewFromHash();
      setView(route.view);
      setActiveBlogSlug(route.slug);
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    syncHashRoute();
    window.addEventListener("hashchange", syncHashRoute);
    return () => window.removeEventListener("hashchange", syncHashRoute);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const raw = max > 0 ? window.scrollY / max : 0;
      const start = 0.7;
      const p = Math.max(0, Math.min(1, (raw - start) / (1 - start)));
      setScrollProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const selectedPost = blogPosts.find((post) => post.slug === activeBlogSlug);

  const bg = dark ? "bg-black text-white" : "bg-white text-black";
  const border = dark ? "border-white/10" : "border-black/10";
  const borderStrong = dark ? "border-white" : "border-black";

  return (
    <div
      className={`relative min-h-screen w-full ${bg} transition-colors duration-300`}
      style={{ fontFamily: sans }}
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 bottom-0 h-[70vh] z-0 transition-opacity duration-300"
        style={{
          opacity: scrollProgress,
          background: dark
            ? "radial-gradient(ellipse 90% 70% at 50% 100%, rgba(120,20,55,0.85) 0%, rgba(80,10,40,0.55) 30%, rgba(40,5,20,0.25) 60%, rgba(0,0,0,0) 100%)"
            : "radial-gradient(ellipse 90% 70% at 50% 100%, rgba(255,200,215,0.7) 0%, rgba(255,220,225,0.4) 40%, rgba(255,255,255,0) 100%)",
        }}
      />
      <div className="relative z-10 mx-auto w-full max-w-[640px] px-6 sm:px-8">
        {/* HERO */}
        <section className="pt-28 pb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1
                style={{ fontFamily: script, letterSpacing: "-1.2px" }}
                className="text-[48px] leading-[48px]"
              >
                Deborah Anyachukwu
              </h1>
              <div className="mt-5 flex items-center gap-5">
                <a
                  href="#/"
                  className={`text-[10px] uppercase transition-opacity ${view === "home" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                  style={{ letterSpacing: "1px", fontFamily: mono }}
                >
                  Portfolio
                </a>
                <a
                  href="#/blog"
                  className={`text-[10px] uppercase transition-opacity flex items-center gap-1.5 ${view === "blog" ? "opacity-100" : "opacity-40 hover:opacity-100"}`}
                  style={{ letterSpacing: "1px", fontFamily: mono }}
                >
                  Blog <BookOpen size={11} />
                </a>
              </div>
            </div>
            <button
              onClick={(e) => {
                const rect = (
                  e.currentTarget as HTMLElement
                ).getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                const r = Math.hypot(
                  Math.max(x, window.innerWidth - x),
                  Math.max(y, window.innerHeight - y),
                );
                const root = document.documentElement;
                root.style.setProperty("--toggle-x", `${x}px`);
                root.style.setProperty("--toggle-y", `${y}px`);
                root.style.setProperty("--toggle-r", `${r}px`);
                // @ts-ignore
                if (document.startViewTransition) {
                  root.classList.add("theme-toggle-circle");
                  // @ts-ignore
                  const t = document.startViewTransition(() =>
                    setDark((d) => !d),
                  );
                  t.finished.finally(() =>
                    root.classList.remove("theme-toggle-circle"),
                  );
                } else {
                  setDark((d) => !d);
                }
              }}
              aria-label="Toggle theme"
              className="opacity-40 hover:opacity-100 transition-opacity duration-200 p-1"
            >
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {view === "home" ? (
            <p
              className="opacity-60 mt-6 text-[17px] leading-[27.625px]"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            >
              Backend engineer based in Enugu, Nigeria. Over the past months at
              HNG I shipped a profile management API with GitHub OAuth and NLP
              search, a distributed retry engine, and contributed to
              SkillBridge, a talent assessment platform built in NestJS. I care
              about systems that are honest, operable, and built to last.
            </p>
          ) : (
            <p
              className="opacity-60 mt-6 text-[17px] leading-[27.625px]"
              style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            >
              Notes from real backend builds: system design choices, mistakes,
              and what changed between first implementation and final solution.
            </p>
          )}

          <div className="flex gap-6 items-center pt-8">
            <SocialIcon href="https://github.com/Zubbee18" label="GitHub">
              <Github size={16} />
            </SocialIcon>
            <SocialIcon
              href="https://www.linkedin.com/in/deborahanyachukwu"
              label="LinkedIn"
            >
              <Linkedin size={16} />
            </SocialIcon>
            <SocialIcon href={`mailto:${email}`} label="Email">
              <Mail size={16} />
            </SocialIcon>
          </div>
        </section>

        {view === "home" && (
          <>
            {/* SKILLS */}
            <section className={`border-t ${border} pt-8 pb-12`}>
              <h2
                className="text-[24px] leading-[32px]"
                style={{ fontWeight: 500, letterSpacing: "-0.6px" }}
              >
                Backend Skills
              </h2>
              <div className="pt-8 flex flex-col gap-4">
                {skills.map((s) => (
                  <div
                    key={s.name}
                    className="flex items-start justify-between gap-4"
                  >
                    <h3
                      className="text-[14px] leading-[20px]"
                      style={{ fontWeight: 500 }}
                    >
                      {s.name}
                    </h3>
                    <span
                      className="opacity-40 text-[11px] leading-[16px] whitespace-nowrap pt-0.5"
                      style={{ fontFamily: mono, letterSpacing: "0.5px" }}
                    >
                      {s.project}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* PROJECTS */}
            <section className={`border-t ${border} pt-12 pb-12`}>
              <h2
                className="text-[24px] leading-[32px]"
                style={{ fontWeight: 500, letterSpacing: "-0.6px" }}
              >
                HNG Projects
              </h2>
              <div className="pt-10 flex flex-col gap-12">
                {projects.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-start justify-between">
                      <h3
                        className="text-[18px] leading-[28px]"
                        style={{ fontWeight: 500 }}
                      >
                        {p.name}
                      </h3>
                      <span
                        className="opacity-40 text-[12px] leading-[16px] pt-2"
                        style={{ fontFamily: mono }}
                      >
                        {p.year}
                      </span>
                    </div>
                    <p
                      className="opacity-60 text-[14px] leading-[22.75px] pt-2"
                      style={{ fontWeight: 300 }}
                    >
                      {p.description}
                    </p>
                    <p
                      className="opacity-50 text-[13px] leading-[20px] pt-3"
                      style={{ fontFamily: mono, letterSpacing: "0.3px" }}
                    >
                      {p.stack.join(" · ")}
                    </p>
                    <p
                      className="opacity-70 text-[13px] leading-[21px] pt-3"
                      style={{ fontWeight: 300 }}
                    >
                      <span
                        className="opacity-50 uppercase text-[10px]"
                        style={{ letterSpacing: "1px", fontFamily: mono }}
                      >
                        My work:{" "}
                      </span>
                      {p.contribution}
                    </p>
                    <div className="flex gap-6 items-center pt-4">
                      {p.live && (
                        <a
                          href={p.live}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] uppercase"
                          style={{ letterSpacing: "1px" }}
                        >
                          Live <ExternalLink size={10} />
                        </a>
                      )}
                      {p.source && (
                        <LinkPreview
                          url={p.source}
                          className="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] uppercase"
                        >
                          Source <ExternalLink size={10} />
                        </LinkPreview>
                      )}
                      {p.extraLinks?.map((link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] uppercase"
                          style={{ letterSpacing: "1px" }}
                        >
                          {link.label} <ExternalLink size={10} />
                        </a>
                      ))}
                      <a
                        href={`#/blog/${encodeURIComponent(p.blogSlug)}`}
                        className="opacity-40 hover:opacity-100 transition-opacity flex items-center gap-1.5 text-[10px] uppercase"
                        style={{ letterSpacing: "1px" }}
                      >
                        Blog <BookOpen size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* FEATURED PROJECT */}
            <section className={`border-t ${border} pt-12 pb-12`}>
              <h2
                className="text-[24px] leading-[32px]"
                style={{ fontWeight: 500, letterSpacing: "-0.6px" }}
              >
                Featured Project
              </h2>
              <p
                className="opacity-50 text-[12px] uppercase pt-1"
                style={{ fontFamily: mono, letterSpacing: "1px" }}
              >
                Insighta Deep Dive
              </p>

              <div className="pt-8 flex flex-col gap-8">
                <div>
                  <h3
                    className="text-[13px] uppercase opacity-50"
                    style={{ fontFamily: mono, letterSpacing: "1px" }}
                  >
                    The Problem
                  </h3>
                  <p
                    className="opacity-70 text-[14px] leading-[22px] pt-3"
                    style={{ fontWeight: 300 }}
                  >
                    Managing a growing set of user profiles sourced from
                    external data providers (Genderize, Agify, Nationalize, REST
                    Countries) and making them searchable without forcing users
                    into rigid query syntax.
                  </p>
                </div>

                <div>
                  <h3
                    className="text-[13px] uppercase opacity-50"
                    style={{ fontFamily: mono, letterSpacing: "1px" }}
                  >
                    Architecture
                  </h3>
                  <p
                    className="opacity-70 text-[14px] leading-[22px] pt-3"
                    style={{ fontWeight: 300 }}
                  >
                    Express.js → PostgreSQL + Redis → External APIs. Clients
                    (Web Portal + CLI) pass through CORS, JWT auth, and API
                    versioning middleware before hitting routes. Redis handles
                    sessions and token blacklisting. PostgreSQL stores profiles,
                    users, and attempt history.
                  </p>
                </div>

                <div>
                  <h3
                    className="text-[13px] uppercase opacity-50"
                    style={{ fontFamily: mono, letterSpacing: "1px" }}
                  >
                    Key Endpoints
                  </h3>
                  <div className="pt-3 flex flex-col gap-2">
                    {[
                      ["POST /auth/github/cli/callback", "CLI OAuth exchange"],
                      ["POST /auth/refresh", "Token rotation + blacklist"],
                      ["GET /api/profiles/search", "Natural language query"],
                      ["GET /api/profiles/dashboard", "Aggregated analytics"],
                      ["GET /api/profiles/export", "Admin CSV export"],
                    ].map(([endpoint, label]) => {
                      const path = endpoint.split(" ")[1];
                      const href = `https://ubiquitous-chainsaw-production-73a8.up.railway.app${path}`;
                      return (
                        <div
                          key={endpoint}
                          className="flex items-start justify-between gap-4"
                        >
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[12px] hover:opacity-100 transition-opacity"
                            style={{ fontFamily: mono, opacity: 0.7 }}
                          >
                            {endpoint}
                          </a>
                          <span
                            className="opacity-40 text-[11px] whitespace-nowrap pt-0.5"
                            style={{ fontWeight: 300 }}
                          >
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3
                    className="text-[13px] uppercase opacity-50"
                    style={{ fontFamily: mono, letterSpacing: "1px" }}
                  >
                    Challenge Solved
                  </h3>
                  <p
                    className="opacity-70 text-[14px] leading-[22px] pt-3"
                    style={{ fontWeight: 300 }}
                  >
                    Natural language search without AI. I built a rule-based
                    parser that maps plain-text phrases like{" "}
                    <span
                      className="opacity-100"
                      style={{ fontFamily: mono, fontSize: "12px" }}
                    >
                      "female adults from Nigeria under 30"
                    </span>{" "}
                    to parameterised SQL conditions, resolving country names
                    through the REST Countries API to ISO 3166 codes, and
                    mapping age keywords to numeric ranges. No LLMs, no external
                    NLP service.
                  </p>
                </div>
              </div>
            </section>

            {/* LEARNING REFLECTION */}
            <section className={`border-t ${border} pt-12 pb-12`}>
              <h2
                className="text-[24px] leading-[32px]"
                style={{ fontWeight: 500, letterSpacing: "-0.6px" }}
              >
                Learning Reflection
              </h2>
              <div className="pt-10 flex flex-col gap-8">
                {reflections.map((r) => (
                  <div key={r.title}>
                    <h3
                      className="text-[16px] leading-[24px]"
                      style={{ fontWeight: 500 }}
                    >
                      {r.title}
                    </h3>
                    <p
                      className="opacity-60 text-[14px] leading-[22.75px] pt-2"
                      style={{ fontWeight: 300 }}
                    >
                      {r.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {view === "blog" && (
          <section className={`border-t ${border} pt-12 pb-12`}>
            {!selectedPost ? (
              <>
                <h2
                  className="text-[24px] leading-[32px]"
                  style={{ fontWeight: 500, letterSpacing: "-0.6px" }}
                >
                  Blog
                </h2>
                <p
                  className="opacity-50 text-[12px] uppercase pt-1"
                  style={{ fontFamily: mono, letterSpacing: "1px" }}
                >
                  Engineering Writeups
                </p>

                <div className="pt-10 flex flex-col gap-8">
                  {blogPosts.map((post) => (
                    <article key={post.slug} className={`border ${border} p-5`}>
                      <h3
                        className="text-[18px] leading-[28px]"
                        style={{ fontWeight: 500 }}
                      >
                        {post.title}
                      </h3>
                      <p
                        className="opacity-50 text-[11px] uppercase pt-2"
                        style={{ fontFamily: mono, letterSpacing: "1px" }}
                      >
                        {post.projectName}
                      </p>
                      <p
                        className="opacity-70 text-[14px] leading-[22px] pt-3"
                        style={{ fontWeight: 300 }}
                      >
                        {post.summary}
                      </p>
                      <div className="pt-4 flex items-center justify-between">
                        <a
                          href={`#/blog/${encodeURIComponent(post.slug)}`}
                          className="opacity-60 hover:opacity-100 transition-opacity text-[10px] uppercase flex items-center gap-1.5"
                          style={{ letterSpacing: "1px" }}
                        >
                          Open writeup <ExternalLink size={10} />
                        </a>
                        <span
                          className="opacity-40 text-[10px] uppercase"
                          style={{ letterSpacing: "1px", fontFamily: mono }}
                        >
                          Template ready
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <article>
                <a
                  href="#/blog"
                  className="opacity-40 hover:opacity-100 transition-opacity text-[10px] uppercase inline-flex items-center gap-1.5"
                  style={{ letterSpacing: "1px" }}
                >
                  <ArrowLeft size={10} /> Back to all posts
                </a>
                <h2
                  className="text-[28px] leading-[38px] pt-6"
                  style={{ fontWeight: 500, letterSpacing: "-0.8px" }}
                >
                  {selectedPost.title}
                </h2>
                <p
                  className="opacity-50 text-[12px] uppercase pt-2"
                  style={{ fontFamily: mono, letterSpacing: "1px" }}
                >
                  {selectedPost.projectName}
                </p>
                <p
                  className="opacity-50 text-[11px] uppercase pt-5"
                  style={{ fontFamily: mono, letterSpacing: "1px" }}
                >
                  Written by Zubbee™
                </p>
                <div className="pt-2">
                  {renderMarkdownBlocks(selectedPost.content)}
                </div>
              </article>
            )}
          </section>
        )}

        {/* CONTACT */}
        <section className="pt-20 pb-10">
          <div className="flex flex-col items-center">
            <h2
              className="text-[60px] leading-[60px] text-center bg-clip-text text-transparent"
              style={{
                fontWeight: 500,
                letterSpacing: "-3px",
                backgroundImage: dark
                  ? "linear-gradient(to bottom, rgba(255,255,255,0.4), #ffffff)"
                  : "linear-gradient(to bottom, rgba(0,0,0,0.4), #000000)",
              }}
            >
              Let's build.
            </h2>
            <p
              className="text-[18px] leading-[28px] text-center pt-4 max-w-[384px]"
              style={{ fontWeight: 300 }}
            >
              Open to backend engineering roles and collaborations. Enugu,
              Nigeria · UTC+1.
            </p>
            <button
              onClick={handleCopy}
              className={`mt-12 flex items-center gap-4 pb-2.5 border-b-2 ${borderStrong} w-full max-w-[404px] justify-center`}
            >
              <span
                className="text-[24px] leading-[32px] text-center"
                style={{ fontWeight: 500 }}
              >
                {email}
              </span>
              {copied ? (
                <Check size={20} />
              ) : (
                <Copy size={20} className="opacity-40" />
              )}
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer
          className={`border-t ${border} pt-10 pb-10 flex items-center justify-between`}
        >
          <p
            className="text-[10px] uppercase leading-[15px]"
            style={{ fontWeight: 500, letterSpacing: "1px" }}
          >
            © 2026 Deborah Anyachukwu.
            <br />
            All Rights Reserved.
          </p>
          <button onClick={scrollTop} className="flex gap-3 items-center group">
            <span
              className="text-[10px] uppercase"
              style={{ fontWeight: 500, letterSpacing: "1px" }}
            >
              Back to Top
            </span>
            <span
              className={`rounded-full size-7 border ${borderStrong} flex items-center justify-center group-hover:-translate-y-0.5 transition-transform`}
            >
              <ArrowUp size={14} />
            </span>
          </button>
        </footer>
      </div>
      <Analytics />
    </div>
  );
}
