import { FormEvent, FormEventHandler } from "react";
import { HiOutlinePlusCircle } from "react-icons/hi";

export const AddAccountForm = ({
  onSubmit,
  className,
}: {
  className?: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) => {
  return (
    <form
      className={
        "flex flex-col items-center gap-2 sm:flex-row" + ` ${className}`
      }
      onSubmit={onSubmit}
    >
      <input
        type="text"
        name="newAddress"
        pattern="0x[a-zA-Z0-9]{40}"
        placeholder="Address"
        required
        className="w-64 px-2 py-1 text-slate-900"
      />
      <input
        type="text"
        name="newLabel"
        placeholder="Optional label"
        className="w-64 px-2 py-1 text-slate-900"
      />
      <button type="submit">
        <HiOutlinePlusCircle className="text-2xl" />
      </button>
    </form>
  );
};
