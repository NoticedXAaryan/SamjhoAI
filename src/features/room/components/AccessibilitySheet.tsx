'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import type { AccessibilityPreferences } from '@/shared/lib/types';

interface Props {
  open: boolean;
  onClose: () => void;
  prefs: AccessibilityPreferences;
  onChange: (p: AccessibilityPreferences) => void;
}

export function AccessibilitySheet({ open, onClose, prefs, onChange }: Props) {
  const set = <K extends keyof AccessibilityPreferences>(key: K) => (val: AccessibilityPreferences[K]) =>
    onChange({ ...prefs, [key]: val });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-80 bg-card border-border">
        <SheetHeader>
          <SheetTitle>Accessibility</SheetTitle>
          <SheetDescription>Personalise your in-meeting experience.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <Section label="Captions">
            <Row label="Enable live captions">
              <Switch
                checked={prefs.captionsEnabled}
                onCheckedChange={set('captionsEnabled')}
              />
            </Row>
            {prefs.captionsEnabled && (
              <>
                <Row label="Size">
                  <Pick
                    value={prefs.captionsSize}
                    onChange={set('captionsSize')}
                    options={[
                      ['sm', 'Small'],
                      ['md', 'Medium'],
                      ['lg', 'Large'],
                    ]}
                  />
                </Row>
                <Row label="Position">
                  <Pick
                    value={prefs.captionsPosition}
                    onChange={set('captionsPosition')}
                    options={[
                      ['top', 'Top'],
                      ['bottom', 'Bottom'],
                    ]}
                  />
                </Row>
              </>
            )}
          </Section>

          <Separator />

          <Section label="Gestures">
            <Row label="Show gesture recognition">
              <Switch
                checked={prefs.gestureDisplayEnabled}
                onCheckedChange={set('gestureDisplayEnabled')}
              />
            </Row>
          </Section>

          <Separator />

          <Section label="Visual">
            <Row label="High contrast">
              <Switch checked={prefs.highContrast} onCheckedChange={set('highContrast')} />
            </Row>
          </Section>

          <Separator />

          <Section label="Language">
            <Row label="Speech language">
              <Pick
                value={prefs.preferredLanguage}
                onChange={set('preferredLanguage')}
                options={[
                  ['en', 'English'],
                  ['es', 'Spanish'],
                  ['fr', 'French'],
                  ['de', 'German'],
                  ['hi', 'Hindi'],
                  ['ja', 'Japanese'],
                ]}
              />
            </Row>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Private layout helpers — not exported, not reused elsewhere
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-sm font-normal">{label}</Label>
      {children}
    </div>
  );
}

function Pick<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
      <SelectTrigger className="w-28 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, l]) => (
          <SelectItem key={v} value={v}>
            {l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
