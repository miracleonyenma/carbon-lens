import React, { ReactNode } from "react";
import { formatCurrency } from "@/utils/aevr/number-formatter";
import { cn } from "@/lib/utils";

export interface SummaryItem {
  label: string;
  value: ReactNode;
  price?: {
    amount: Maybe<number>;
    currency: Maybe<string>;
  };
  content?: ReactNode;
}

type Maybe<T> = T | null | undefined;

const SummaryCard: React.FC<{
  items: SummaryItem[];
  summary?: Maybe<SummaryItem>;
  layout?: "vertical" | "horizontal";
  className?: string;
  itemClassName?: string;
}> = ({ items, summary, layout = "vertical", className, itemClassName }) => {
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={cn(
        `flex w-full ${
          isHorizontal ? "flex-col" : "flex-col"
        } bg-background gap-0 ${
          summary ? "bg-muted rounded-t-2xl rounded-b-2xl" : "rounded-2xl"
        }`,
        className
      )}
    >
      {/* Items Container */}
      <div className={`flex ${isHorizontal ? "flex-row" : "flex-col"} gap-0`}>
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              `bg-card border-muted flex w-full flex-wrap items-end justify-between border border-b-[0.5] px-3 py-3 ${
                isHorizontal
                  ? // Horizontal layout classes
                    `flex-1 ${
                      index === 0
                        ? "rounded-l-xl border-r-0"
                        : index === items.length - 1
                        ? "rounded-r-xl border-l-0"
                        : "border-r-0 border-l-0"
                    } ${
                      summary && index === items.length - 1
                        ? "rounded-br-2xl"
                        : ""
                    } ${summary && index === 0 ? "rounded-bl-2xl" : ""}`
                  : // Vertical layout classes (original)
                    `${index === 0 && "rounded-t-xl"} ${
                      index === items.length - 1 ? "rounded-b-2xl border-b" : ""
                    } ${
                      summary
                        ? index === items.length - 1
                          ? "rounded-b-2xl border-b"
                          : ""
                        : ""
                    }`
              }`,
              itemClassName
            )}
          >
            <div className="flex flex-col gap-0">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {item.label}
              </span>
              {typeof item.value === "string" && item.value.length > 0 ? (
                <span className="font-medium text-neutral-900 dark:text-neutral-100">
                  {item.value}
                </span>
              ) : (
                item.value
              )}
            </div>
            {item?.content ? (
              <>{item?.content}</>
            ) : item?.price ? (
              <div className="flex text-lg font-bold">
                {formatCurrency(item?.price?.amount || 0, {
                  currency: item?.price?.currency || "USD",
                  locale: "en-US",
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* Summary Section - Always at bottom */}
      {summary && (
        <div className="bg-muted flex items-end justify-between rounded-b-2xl border-t-0 p-3">
          <div className="flex flex-col gap-0">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {summary.label}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {summary.value || "Not provided"}
            </span>
          </div>
          {summary?.content ? (
            <>{summary?.content}</>
          ) : summary.price ? (
            <div className="flex text-lg font-bold">
              {formatCurrency(summary?.price?.amount || 0, {
                currency: summary?.price?.currency || "USD",
                locale: "en-US",
              })}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
