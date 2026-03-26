import React from "react";
import { Link } from "react-router-dom";
import { Button, Card } from "../ui/components";

// PUBLIC_INTERFACE
export function UnauthorizedPage() {
  /** Displays lack-of-permission message. */
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="p-6">
        <div className="text-lg font-bold text-gray-900">Unauthorized</div>
        <div className="mt-2 text-sm text-gray-600">
          You don’t have access to this section. If you think this is a mistake, contact an administrator.
        </div>
        <div className="mt-4">
          <Link to="/app/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
