import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Platoon } from '@/types/scheduling';
import { useSoldiers } from '@/hooks/useSoldiers';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatoonFormProps {
  platoon?: Platoon;
  onSubmit: (data: { name: string; commander?: string; description?: string }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function PlatoonForm({ platoon, onSubmit, onCancel, isSubmitting }: PlatoonFormProps) {
  const [name, setName] = useState(platoon?.name || '');
  const [commander, setCommander] = useState(platoon?.commander || '');
  const [description, setDescription] = useState(platoon?.description || '');
  const [open, setOpen] = useState(false);

  const { data: soldiers = [] } = useSoldiers();

  // Filter soldiers with 'commander' role
  const commanders = useMemo(() => {
    return soldiers.filter((soldier) => soldier.roles.includes('commander'));
  }, [soldiers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      commander: commander || undefined,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">שם המחלקה *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>מפקד</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between mt-1.5"
            >
              {commander || "בחר מפקד..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="חפש מפקד..." />
              <CommandEmpty>לא נמצא מפקד</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value=""
                  onSelect={() => {
                    setCommander('');
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      commander === '' ? "opacity-100" : "opacity-0"
                    )}
                  />
                  ללא מפקד
                </CommandItem>
                {commanders.map((soldier) => (
                  <CommandItem
                    key={soldier.id}
                    value={soldier.name}
                    onSelect={(currentValue) => {
                      setCommander(currentValue === commander ? '' : currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        commander === soldier.name ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {soldier.name} - {soldier.rank}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="description">תיאור</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="mt-1.5"
        />
      </div>

      {platoon && (
        <div className="bg-muted/50 rounded-lg p-3">
          <Label className="text-xs text-muted-foreground">צבע</Label>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: platoon.color }}
            />
            <span className="text-sm">{platoon.color}</span>
            <span className="text-xs text-muted-foreground">(מוקצה אוטומטית)</span>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          ביטול
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'שומר...' : platoon ? 'עדכן' : 'צור מחלקה'}
        </Button>
      </div>
    </form>
  );
}
