import './ProfileDisplay.css';

interface ProfileDisplayProps {
  loading: boolean;
  account: {
    avatar: string | null;
    displayName: string;
    createdAt: string;
  } | null;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function ProfileDisplay({ loading, account }: ProfileDisplayProps) {
  return (
    <div className="account-card">
      {loading && (
        <div className="loading-state">
          <p>Loading account information...</p>
        </div>
      )}

      {!loading && account && (
        <div className="profile-container">
          <div className="profile-image-section">
            <img
              src={account.avatar || '/mystery-actor.png'}
              alt={account.displayName}
              className="profile-image"
              onError={(e) => {
                e.currentTarget.src = '/mystery-actor.png';
              }}
            />
          </div>

          <div className="profile-info-section">
            <h2 className="profile-username">{account.displayName}</h2>
            <p className="profile-joined">Joined {formatDate(account.createdAt)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
