import './Skeleton.css';

export const Skeleton = ({ width, height, radius = '4px', className = '' }) => {
  return (
    <div 
      className={`skeleton-base ${className}`}
      style={{ 
        width: width || '100%', 
        height: height || '20px', 
        borderRadius: radius 
      }}
    />
  );
};

export const DonationCardSkeleton = () => {
  return (
    <div className="glass-card skeleton-card">
      <div className="skeleton-header">
        <Skeleton width="60px" height="24px" radius="20px" />
        <Skeleton width="40px" height="24px" radius="20px" />
      </div>
      <Skeleton width="80%" height="24px" className="skeleton-title-main" />
      <Skeleton width="100%" height="60px" className="skeleton-text" />
      <div className="skeleton-footer">
        <Skeleton width="100px" height="32px" />
        <Skeleton width="80px" height="32px" />
      </div>
    </div>
  );
};
