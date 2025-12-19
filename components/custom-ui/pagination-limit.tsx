import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaginationLimitProps {
  value: number;
  onValueChange: (value: string) => void;
  options?: number[];
}

export function PaginationLimit({
  value,
  onValueChange,
  options = [10, 25, 50, 100],
}: PaginationLimitProps) {
  return (
    <div className="flex justify-start items-center gap-2">
      <span className="text-sm text-muted-foreground">Show:</span>
      <Select value={value.toString()} onValueChange={onValueChange}>
        <SelectTrigger className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
