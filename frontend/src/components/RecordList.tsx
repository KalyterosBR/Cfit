import type { ComponentPropsWithoutRef } from "react";

type RecordListProps = ComponentPropsWithoutRef<"div">;

export default function RecordList({ className = "", ...props }: RecordListProps) {
  return <div className={`cfit-record-list ${className}`.trim()} {...props} />;
}
