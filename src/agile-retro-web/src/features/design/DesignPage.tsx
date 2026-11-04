import { useState, type ReactNode } from 'react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Drawer,
  Field,
  Input,
  Textarea,
} from '../../shared/components/ui'
import { cn } from '../../shared/utils/cn'
import { ThemeToggle } from '../../shared/components/ThemeToggle'
import { useTheme } from '../../shared/theme'

const colors = [
  { name: 'bg', className: 'bg-bg' },
  { name: 'surface', className: 'bg-surface' },
  { name: 'surface-muted', className: 'bg-surface-muted' },
  { name: 'border', className: 'bg-border' },
  { name: 'text', className: 'bg-text' },
  { name: 'muted', className: 'bg-muted' },
  { name: 'primary', className: 'bg-primary' },
  { name: 'danger', className: 'bg-danger' },
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning' },
]

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className={cn('h-14 rounded-lg border border-border shadow-sm', className)}
      />
      <code className="text-xs text-muted">{name}</code>
    </div>
  )
}

function DrawerForm() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Field label="Session name" hint="Shown to everyone who joins." required>
          <Input placeholder="Sprint 42 retro" />
        </Field>
        <Field
          label="Facilitator note"
          error="Keep it under 140 characters."
        >
          <Input defaultValue="Focus on what we can change." aria-invalid />
        </Field>
        <Field label="Agenda">
          <Textarea placeholder="What went well, what to improve, action items" />
        </Field>
      </div>

      <div className="mt-auto flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost">Cancel</Button>
        <Button>Save</Button>
      </div>
    </div>
  )
}

export function DesignPage() {
  const [rightOpen, setRightOpen] = useState(false)
  const [leftOpen, setLeftOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { preference, resolvedTheme } = useTheme()

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Design system</h1>
        <p className="max-w-prose text-muted">
          Tokens and primitives shared across the app. Colors come from CSS
          variables in <code className="text-text">src/index.css</code>, follow
          the system preference by default, and can be overridden with the
          theme toggle.
        </p>
      </header>

      <Section
        title="Color"
        description="Use the semantic token, not the raw value. Override a token once to retheme every component."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {colors.map((color) => (
            <Swatch key={color.name} name={color.name} className={color.className} />
          ))}
        </div>
      </Section>

      <Section
        title="Theme"
        description="System is the default and keeps following the operating system. Light and Dark pin the choice for this browser and are remembered across visits."
      >
        <div className="flex flex-wrap items-center gap-4">
          <ThemeToggle />
          <p className="text-sm text-muted">
            Preference <code className="text-text">{preference}</code> ·
            resolved <code className="text-text">{resolvedTheme}</code>
          </p>
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            Heading one
          </h1>
          <h2 className="text-2xl font-semibold tracking-tight">
            Heading two
          </h2>
          <h3 className="text-lg font-medium">Heading three</h3>
          <p className="max-w-prose">
            Body text uses the default foreground token. Keep line length
            comfortable with <code className="text-text">max-w-prose</code>.
          </p>
          <p className="text-sm text-muted">
            Muted text is for supporting detail, hints and metadata.
          </p>
        </div>
      </Section>

      <Section
        title="Buttons"
        description="Primary for the main action, secondary for alternatives, ghost for low-emphasis actions, danger for destructive ones."
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>
        </div>
      </Section>

      <Section
        title="Forms"
        description="Field wires the label, hint and error to the control for you."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Display name" hint="Visible to other participants.">
            <Input placeholder="Ada" />
          </Field>
          <Field label="Email" error="Enter a valid email address.">
            <Input defaultValue="not-an-email" aria-invalid />
          </Field>
          <Field label="Session name" required>
            <Input placeholder="Sprint 42 retro" />
          </Field>
          <Field label="Disabled">
            <Input disabled placeholder="Read only" />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <Textarea placeholder="Anything the team should know" />
          </Field>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="primary">In progress</Badge>
          <Badge variant="success">Done</Badge>
          <Badge variant="warning">Blocked</Badge>
          <Badge variant="danger">Overdue</Badge>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="flex flex-col gap-2">
            <h3 className="font-medium">Surface card</h3>
            <p className="text-sm text-muted">
              Cards group related content on the surface token with a subtle
              border and shadow.
            </p>
          </Card>
          <Card className="flex flex-col gap-2 bg-surface-muted">
            <h3 className="font-medium">Muted card</h3>
            <p className="text-sm text-muted">
              Override the surface token with <code>bg-surface-muted</code> for
              secondary content.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="Drawer"
        description="The standard overlay for forms and detail views. A sidebar keeps the board visible, so avoid modals."
      >
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setRightOpen(true)}>Open right drawer</Button>
          <Button variant="secondary" onClick={() => setLeftOpen(true)}>
            Open left drawer
          </Button>
        </div>
      </Section>

      <Section
        title="Confirmation dialog"
        description="A compact dialog for destructive or irreversible actions. Forms and detail views still use the Drawer."
      >
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            Delete card
          </Button>
        </div>
      </Section>

      <Drawer
        isOpen={rightOpen}
        close={() => setRightOpen(false)}
        title="Session details"
        subTitle="Right sidebar, opened from the demo"
      >
        <DrawerForm />
      </Drawer>

      <Drawer
        isOpen={leftOpen}
        close={() => setLeftOpen(false)}
        position="left"
        title="Filters"
        subTitle="Left sidebar for navigation or filters"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            The panel traps focus, closes on Escape or overlay click, and
            restores focus to the trigger when it closes.
          </p>
          <Button variant="secondary" onClick={() => setLeftOpen(false)}>
            Done
          </Button>
        </div>
      </Drawer>

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Delete this card?"
        description="This card will be removed from the board for everyone. This cannot be undone."
        confirmLabel="Delete card"
        tone="danger"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
