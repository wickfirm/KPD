"use client";

/// Destructive buttons (delete / restore) ask for confirmation before the
/// enclosing plain <form action={serverAction}> is allowed to submit.
export function ConfirmButton({
  className,
  children,
  message,
}: {
  className?: string;
  children: React.ReactNode;
  message: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
