"use client";
import React, { useCallback, useState, forwardRef } from "react";
import { getAllISOCodes } from "iso-country-currency";

// shadcn
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

// utils
import { cn } from "@/lib/utils";
import { ArrowDown, Check, CoinsIcon } from "lucide-react";

// assets

// Currency interface
export interface CurrencyOption {
  currency: string;
  symbol: string;
  countryName?: string; // Optional context if we want to show it
}

// Dropdown props
interface CurrencyDropdownProps {
  onChange?: (currency: string) => void;
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  value?: string;
}

const MinimalCurrencySelectComponent = (
  {
    onChange,
    defaultValue,
    value,
    disabled = false,
    placeholder = "Select currency",
    className,
    ...props
  }: CurrencyDropdownProps,
  ref: React.ForwardedRef<HTMLButtonElement>,
) => {
  const [open, setOpen] = useState(false);

  // Process ISO codes to get unique currencies
  const allCurrencies = React.useMemo(() => {
    const codes = getAllISOCodes();
    const uniqueCurrencies = new Map<string, CurrencyOption>();

    codes.forEach((item) => {
      // We prefer keeping the first occurrence or maybe just the code and symbol
      if (!uniqueCurrencies.has(item.currency)) {
        uniqueCurrencies.set(item.currency, {
          currency: item.currency,
          symbol: item.symbol,
        });
      }
    });

    return Array.from(uniqueCurrencies.values()).sort((a, b) =>
      a.currency.localeCompare(b.currency),
    );
  }, []);

  // Derive selected currency directly from props to avoid cascading setState
  const activeValue = value !== undefined ? value : defaultValue;
  const selectedCurrency = activeValue
    ? allCurrencies.find((c) => c.currency === activeValue)
    : undefined;

  const handleSelect = useCallback(
    (option: CurrencyOption) => {
      onChange?.(option.currency);
      setOpen(false);
    },
    [onChange],
  );

  const triggerClasses = cn(
    "flex min-h-9 w-full items-center justify-between whitespace-nowrap rounded-xl border border-input bg-transparent px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    className,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        ref={ref}
        className={triggerClasses}
        disabled={disabled}
        type="button" // Prevent form submission
        {...props}
      >
        {selectedCurrency ? (
          <div className="flex w-0 grow items-center gap-2 overflow-hidden">
            <div className="inline-flex h-6 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {selectedCurrency.symbol}
            </div>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {selectedCurrency.currency}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground flex items-center gap-2">
            <CoinsIcon size={16} />
            {placeholder}
          </span>
        )}
        <ArrowDown size={16} className="ml-2 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        collisionPadding={10}
        side="bottom"
        className="min-w-[--radix-popper-anchor-width] p-0"
      >
        <Command className="max-h-[200px] w-full sm:max-h-[270px]">
          <CommandList>
            <div className="bg-popover sticky top-0 z-10">
              <CommandInput placeholder="Search currency..." />
            </div>
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {allCurrencies.map((option) => (
                <CommandItem
                  className="flex w-full items-center gap-2"
                  key={option.currency}
                  onSelect={() => handleSelect(option)}
                  value={option.currency} // Helper for fuzzy search
                >
                  <div className="flex w-0 grow items-center space-x-2 overflow-hidden">
                    <div className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-slate-100 text-xs font-semibold dark:bg-slate-800">
                      {option.symbol}
                    </div>
                    <span className="overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                      {option.currency}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      option.currency === selectedCurrency?.currency
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

MinimalCurrencySelectComponent.displayName = "MinimalCurrencySelectComponent";

export const MinimalCurrencySelect = forwardRef(MinimalCurrencySelectComponent);
