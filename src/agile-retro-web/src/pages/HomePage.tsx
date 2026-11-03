import { useState, type ComponentType, type FormEvent } from 'react'
import {
  Badge,
  Button,
  Card,
  Drawer,
  Field,
  Input,
} from '../shared/components/ui'
import { cn } from '../shared/utils/cn'

type IconProps = {
  className?: string
}

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function BoltIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z" />
    </svg>
  )
}

function UsersIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" />
      <circle cx="10" cy="7.5" r="3.5" />
      <path d="M20 20v-1.5a3.5 3.5 0 0 0-2.6-3.4M15.5 4.2a3.5 3.5 0 0 1 0 6.6" />
    </svg>
  )
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.5 2.5L16 9.5" />
    </svg>
  )
}

function LockIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="4.5" y="10" width="15" height="10.5" rx="2" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </svg>
  )
}

const steps = [
  {
    title: 'Create a board',
    body: 'Name the retro and open a session. The board is ready in seconds — no template wrangling.',
  },
  {
    title: 'Share one link',
    body: 'Send the join link to your team. They pick a display name; no accounts, no invitations to manage.',
  },
  {
    title: 'Retro together',
    body: 'Everyone adds cards at the same time. Votes and action items stay in sync as you go.',
  },
]

const features: {
  title: string
  body: string
  Icon: ComponentType<IconProps>
}[] = [
  {
    title: 'Changes land instantly',
    body: 'Cards appear for the whole team the moment they are added, without refreshing.',
    Icon: BoltIcon,
  },
  {
    title: 'No accounts for the team',
    body: 'Join with a display name. Nothing to install and nothing to remember.',
    Icon: UsersIcon,
  },
  {
    title: 'Action items that stick',
    body: 'Turn the important points into owners and follow-ups before the retro ends.',
    Icon: CheckIcon,
  },
  {
    title: 'Private by link',
    body: 'Only people holding the share link can open the board and add cards.',
    Icon: LockIcon,
  },
]

const previewColumns = [
  {
    title: 'Went well',
    dotClassName: 'bg-success',
    cards: [
      { author: 'AM', text: 'Pairing on the checkout flow' },
      { author: 'JT', text: 'Reviews turned around same day' },
    ],
  },
  {
    title: 'To improve',
    dotClassName: 'bg-warning',
    cards: [
      { author: 'SK', text: 'Flaky integration tests' },
      { author: 'AM', text: 'Wednesday is meeting-heavy' },
    ],
  },
  {
    title: 'Action items',
    dotClassName: 'bg-primary',
    cards: [
      { author: 'JT', text: 'Split the CI pipeline' },
      { author: 'SK', text: 'Timebox stand-up to 10 min' },
    ],
  },
]

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string
  title: string
  body?: string
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-2">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {title}
      </h2>
      {body ? <p className="text-muted">{body}</p> : null}
    </div>
  )
}

function BoardPreview() {
  return (
    <div aria-hidden="true" className="relative hidden select-none sm:block">
      <div className="absolute -inset-4 rounded-[2rem] bg-primary/5 blur-2xl" />
      <div className="relative rounded-2xl border border-border bg-surface p-3 shadow-2xl shadow-primary/10 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium">Sprint 42 retro</span>
            <span className="text-xs text-muted">Facilitated by Ada</span>
          </div>
          <Badge variant="success" className="shrink-0 gap-1.5">
            <span className="size-1.5 rounded-full bg-success" />
            Live
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {previewColumns.map((column) => (
            <div
              key={column.title}
              className="flex flex-col gap-2 rounded-lg bg-bg p-2"
            >
              <div className="flex items-center gap-1.5 px-0.5">
                <span
                  className={cn('size-1.5 rounded-full', column.dotClassName)}
                />
                <span className="truncate text-[11px] font-medium">
                  {column.title}
                </span>
                <span className="ml-auto text-[10px] text-muted">
                  {column.cards.length}
                </span>
              </div>

              {column.cards.map((card) => (
                <div
                  key={card.text}
                  className="rounded-md border border-border bg-surface p-2 shadow-sm"
                >
                  <p className="text-[11px] leading-snug">{card.text}</p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <span className="grid size-4 place-items-center rounded-full bg-primary/10 text-[8px] font-semibold text-primary">
                      {card.author}
                    </span>
                    <span className="text-[10px] text-muted">just now</span>
                  </div>
                </div>
              ))}

              <div className="rounded-md border border-dashed border-border p-1.5 text-center text-[10px] text-muted">
                Add card
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CreateSessionDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <Drawer
      isOpen={isOpen}
      close={onClose}
      title="Create a session"
      subTitle="Set up a board for your team"
    >
      <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Field label="Session name" hint="For example, Sprint 42 retro." required>
            <Input placeholder="Sprint 42 retro" name="sessionName" />
          </Field>
          <Field label="Your name" hint="Shown on the cards you add." required>
            <Input placeholder="Ada Lovelace" name="displayName" autoComplete="name" />
          </Field>
        </div>

        <p className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted">
          Preview only — session creation is the next step. This form is ready
          for the API.
        </p>

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled>
            Create session
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

function JoinSessionDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
  }

  return (
    <Drawer
      isOpen={isOpen}
      close={onClose}
      title="Join a session"
      subTitle="Use the link your facilitator shared"
    >
      <form className="flex h-full flex-col gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <Field
            label="Session link or code"
            hint="Paste the full link or just the code."
            required
          >
            <Input placeholder="agile-retro.app/join/brave-otter-42" name="sessionCode" />
          </Field>
          <Field label="Your name" hint="Shown on the cards you add." required>
            <Input placeholder="Ada Lovelace" name="displayName" autoComplete="name" />
          </Field>
        </div>

        <p className="rounded-lg border border-border bg-surface-muted p-3 text-sm text-muted">
          Preview only — joining opens once sessions exist. This form is ready
          for the API.
        </p>

        <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled>
            Join session
          </Button>
        </div>
      </form>
    </Drawer>
  )
}

export function HomePage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  return (
    <div className="flex flex-col gap-20 pb-6">
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pt-10">
        <div className="flex flex-col items-start gap-5">
          <Badge variant="primary">Real-time retrospectives</Badge>

          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Retros that end with{' '}
            <span className="text-primary">action</span>, not sticky notes.
          </h1>

          <p className="max-w-prose text-lg text-muted">
            Create a board, share one link, and your team adds cards live. No
            accounts, no downloads, no cleanup.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              Create a session
              <ArrowRightIcon className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setJoinOpen(true)}
            >
              Join with a link
            </Button>
          </div>

          <p className="text-sm text-muted">
            Free to try · No sign-up · Works on any device
          </p>
        </div>

        <BoardPreview />
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, one shared board"
          body="Skip the setup ritual. The whole team is adding cards in under a minute."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} className="flex flex-col gap-3">
              <span
                aria-hidden="true"
                className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
              >
                {index + 1}
              </span>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <SectionHeading
          eyebrow="Why teams use it"
          title="Everything you need to run the retro, nothing you don't"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ title, body, Icon }) => (
            <Card key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-border bg-surface px-6 py-12 text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 size-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative flex flex-col items-center gap-3">
          <h2 className="max-w-xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            Your next retro can end with a plan
          </h2>
          <p className="max-w-xl text-muted">
            Open a board, invite the team with a link, and leave with action
            items instead of a wall of notes.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setCreateOpen(true)}>
              Create a session
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setJoinOpen(true)}
            >
              Join a session
            </Button>
          </div>
        </div>
      </section>

      <CreateSessionDrawer
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
      />
      <JoinSessionDrawer
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
      />
    </div>
  )
}
