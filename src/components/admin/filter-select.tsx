"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
/**
 * One filter, as a design-system picker that writes the URL.
 *
 * The filter bar used to be a GET form of native selects; now each picker
 * merges its own param into the current query — still plain URL params that
 * survive a refresh and can be pasted into a message, with the page reset
 * because page two of a different filter is a different list.
 */
export function FilterSelect({
  param,
  label,
  value,
  options,
  className,
  triggerClassName,
}: {
  /** The search param this filter owns. */
  param: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  className?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams);
        if (next) params.set(param, next);
        else params.delete(param);
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
      }}
      items={options}
    >
      <SelectTrigger aria-label={label} className={triggerClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={className}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
