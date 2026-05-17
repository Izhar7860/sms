import React from 'react'
import { useNavigate } from 'react-router-dom'

function StatCard({
  title,
  value,
  action,
  icon,
  onAction,
}: {
  title: string
  value: string
  action: string
  icon: React.ReactNode
  onAction?: () => void
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="mt-2 text-2xl font-bold">{value}</div>
        </div>
        <div className="hidden rounded-xl bg-primary/10 p-3 text-primary md:block">{icon}</div>
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={onAction}
          disabled={!onAction}
          className={
            onAction
              ? 'h-10 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/15 transition'
              : 'h-10 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-400 cursor-not-allowed'
          }
        >
          {action}
        </button>
      </div>
    </div>
  )
}

export function ResidentDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Resident Dashboard</h1>
            <p className="text-sm text-gray-600">
              View your key status at a glance (dues, notices, complaints, and visitors).
            </p>
          </div>
          <div className="hidden rounded-xl bg-primary/10 p-3 text-primary md:block">
            <i className="fas fa-city" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Current Dues"
          value="—"
          action="Pay Now"
          icon={<i className="fas fa-rupee-sign" />}
        />

        <StatCard
          title="Pending Complaints"
          value="—"
          action="View"
          icon={<i className="fas fa-exclamation-triangle" />}
        />

        <StatCard
          title="Active Notices"
          value="—"
          action="Browse"
          icon={<i className="fas fa-bullhorn" />}
        />

        <StatCard
          title="Visitor Requests"
          value="—"
          action="History"
          icon={<i className="fas fa-door-open" />}
          onAction={() => navigate('/resident/visitors')}
        />
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-600">
          Quick Actions
        </h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate('/resident/profile')}
            className="rounded-xl bg-gray-50 p-4 text-left hover:bg-gray-100 transition"
          >
            <div className="text-sm font-semibold">Manage Profile</div>
            <div className="mt-1 text-sm text-gray-600">Edit details & profile photo.</div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/resident/visitors')}
            className="rounded-xl bg-gray-50 p-4 text-left hover:bg-gray-100 transition"
          >
            <div className="text-sm font-semibold">Visitor History</div>
            <div className="mt-1 text-sm text-gray-600">Track status in real-time.</div>
          </button>

          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm font-semibold">Change Password</div>
            <div className="mt-1 text-sm text-gray-600">Secure your account.</div>
            <div className="mt-3 text-xs text-gray-500">Under construction</div>
          </div>
        </div>
      </div>
    </div>
  )
}

