"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  MapPinIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";

import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/app/actions/account";
import { AddressFormDialog, type AddressRecord } from "@/components/account/address-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The address book.
 *
 * The page server renders the customer's addresses and this keeps the working
 * copy while the drawer is open. Every mutation decides the outcome here too —
 * a new default evicts the old default, deleting the default promotes the next
 * in line — so the list never argues with itself between server round trips.
 * The actions still revalidate the account segment, so the next navigation is
 * built from the server's version of what changed.
 */
export function AddressesManager({
  initial,
}: {
  initial: AddressRecord[];
}) {
  const [addresses, setAddresses] = useState<AddressRecord[]>(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AddressRecord | null>(null);
  const [deleting, setDeleting] = useState<AddressRecord | null>(null);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(address: AddressRecord) {
    setEditing(address);
    setFormOpen(true);
  }

  function sortBook(list: AddressRecord[]) {
    return [...list].sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id.localeCompare(b.id),
    );
  }

  /** A saved address comes back from the server as the row it now owns. */
  function onSaved(saved: AddressRecord) {
    if (editing) {
      setAddresses((prev) =>
        sortBook(
          prev.map((address) =>
            address.id === saved.id
              ? saved
              : saved.isDefault
                ? { ...address, isDefault: false }
                : address,
          ),
        ),
      );
      toast.success("Address updated.");
    } else {
      setAddresses((prev) =>
        sortBook(
          prev
            .map((address) => ({ ...address, isDefault: false }))
            .concat({ ...saved, isDefault: saved.isDefault || prev.length === 0 }),
        ),
      );
      toast.success("Address added.");
    }

    setFormOpen(false);
    setEditing(null);
  }

  async function onDelete() {
    if (!deleting) return;

    const result = await deleteAddressAction({ addressId: deleting.id });

    if (!result.success) {
      toast.error(result.error ?? "We could not remove that address.");
      return;
    }

    setAddresses((prev) => {
      const rest = prev.filter((address) => address.id !== deleting.id);
      const promoteNext = deleting.isDefault && rest.length > 0;
      return sortBook(
        promoteNext
          ? rest.map((address, index) =>
              index === 0 ? { ...address, isDefault: true } : address,
            )
          : rest,
      );
    });

    toast.success("Address removed.");
    setDeleting(null);
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <p className="text-small text-text-muted">
          {addresses.length === 0
            ? "Nothing saved yet."
            : `${addresses.length} ${addresses.length === 1 ? "address" : "addresses"} ready at checkout.`}
        </p>
        <Button variant="secondary" onClick={openCreate}>
          <PlusIcon aria-hidden="true" strokeWidth={1.75} />
          Add address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-ink/20 bg-white/60 p-8 text-center">
          <p className="font-heading text-lg font-semibold text-ink">
            Your book is empty.
          </p>
          <p className="mx-auto mt-2 max-w-[38ch] text-[0.9375rem] leading-relaxed text-ink/60">
            Save a shipping address once, and checkout goes from ten fields to
            one click.
          </p>
          <Button onClick={openCreate} className="mt-5">
            <PlusIcon aria-hidden="true" strokeWidth={1.75} />
            Add your first address
          </Button>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((address) => (
            <li key={address.id}>
              <article
                className={
                  "flex h-full flex-col rounded-xl border bg-white p-5 sm:p-6 " +
                  (address.isDefault ? "border-forest/30" : "border-ink/10")
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint text-forest">
                    <MapPinIcon aria-hidden="true" strokeWidth={1.75} className="size-4.5" />
                  </span>
                  {address.isDefault && (
                    <span className="inline-flex h-6 items-center gap-1 rounded-full border border-forest/20 bg-mint px-2.5 text-[0.75rem] font-medium text-forest">
                      <StarIcon aria-hidden="true" className="size-3" />
                      Default
                    </span>
                  )}
                </div>

                <h3 className="mt-4 font-medium text-ink">{address.fullName}</h3>
                <p className="mt-0.5 text-small text-text-muted">{address.phone}</p>
                <address className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink/70 not-italic">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.postalCode}
                  <br />
                  {address.country}
                </address>

                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(address)}
                  >
                    <PencilIcon aria-hidden="true" strokeWidth={1.75} />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-ink/70 hover:text-ink"
                    onClick={() => setDeleting(address)}
                  >
                    <Trash2Icon aria-hidden="true" strokeWidth={1.75} />
                    Remove
                  </Button>
                  {!address.isDefault && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-auto"
                      onClick={() => void setDefault(address)}
                    >
                      Make default
                    </Button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      <AddressFormDialog
        key={editing?.id ?? "new"}
        open={formOpen}
        onOpenChange={setFormOpen}
        address={editing}
        onSaved={onSaved}
      />

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove this address?</DialogTitle>
            <DialogDescription>
              {deleting ? (
                <>
                  {deleting.fullName}, {deleting.line1}, {deleting.city}.{" "}
                  {deleting.isDefault
                    ? "It is your default — the next address in the book becomes the default."
                    : "You can add it back any time."}
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void onDelete()}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  async function setDefault(address: AddressRecord) {
    const result = await setDefaultAddressAction({ addressId: address.id });

    if (!result.success) {
      toast.error(result.error ?? "We could not change the default.");
      return;
    }

    setAddresses((prev) =>
      sortBook(
        prev.map((item) => ({ ...item, isDefault: item.id === address.id })),
      ),
    );

    toast.success("Default address updated.");
  }
}