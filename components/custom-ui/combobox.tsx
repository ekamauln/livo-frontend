"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export type Item = {
  value: string;
  label: string;
};

interface ComboboxProps {
  items: Item[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder = "Select an items...",
  autoFocus = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (autoFocus && buttonRef.current) {
      buttonRef.current.focus();
      // Small delay to ensure the focus is visible
      setTimeout(() => {
        buttonRef.current?.click();
      }, 100);
    }
  }, [autoFocus]);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center space-x-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={buttonRef}
            variant="outline"
            role="combobox"
            className="min-w-[130px] w-full justify-start font-normal"
          >
            {value
              ? items.find((item) => item.value === value)?.label
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width) min-w-(--radix-popover-trigger-width)"
          side="bottom"
          align="start"
          sideOffset={4}
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px] overflow-y-auto">
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(currentValue) => {
                        onValueChange(currentValue);
                        setSearchQuery("");
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === item.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
