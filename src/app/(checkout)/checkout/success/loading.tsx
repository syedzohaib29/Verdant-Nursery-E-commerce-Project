/**
 * The confirmation, while the page is still loading.
 *
 * A quiet circle where the checkmark animation will draw itself, nothing more —
 * the real animation belongs to the confirmed page.
 */
export default function CheckoutSuccessLoading() {
  return (
    <div className="container-x flex justify-center py-16">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto size-20 animate-pulse rounded-full bg-mint" />
        <div className="mx-auto mt-6 h-9 w-64 max-w-full animate-pulse rounded-lg bg-ink/10" />
        <div className="mx-auto mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-ink/10" />
        <div className="mx-auto mt-12 grid max-w-2xl gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-40 animate-pulse rounded-xl bg-white"
            />
          ))}
        </div>
      </div>
    </div>
  );
}