import Loader from '@components/Shared/Loader';
import UserProfile from '@components/Shared/UserProfile';
import type {
  MutualFollowersProfilesQueryRequest,
  Profile
} from '@lenster/lens';
import { useMutualFollowersQuery } from '@lenster/lens';
import { ErrorMessage } from '@lenster/ui';
import { t } from '@lingui/macro';
import type { FC } from 'react';
import { useState } from 'react';
import { useInView } from 'react-cool-inview';
import { useAppStore } from 'src/store/app';
import { FollowUnfollowSource } from 'src/tracking';

interface MutualFollowersListProps {
  profileId: string;
}

const MutualFollowersList: FC<MutualFollowersListProps> = ({ profileId }) => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const [hasMore, setHasMore] = useState(true);

  // Variables
  const request: MutualFollowersProfilesQueryRequest = {
    viewingProfileId: profileId,
    yourProfileId: currentProfile?.id,
    limit: 10
  };

  const { data, loading, error, fetchMore } = useMutualFollowersQuery({
    variables: { request },
    skip: !profileId
  });

  const profiles = data?.mutualFollowersProfiles?.items;
  const pageInfo = data?.mutualFollowersProfiles?.pageInfo;

  const { observe } = useInView({
    onChange: async ({ inView }) => {
      if (!inView || !hasMore) {
        return;
      }

      await fetchMore({
        variables: { request: { ...request, cursor: pageInfo?.next } }
      }).then(({ data }) => {
        setHasMore(data?.mutualFollowersProfiles?.items?.length > 0);
      });
    }
  });

  if (loading) {
    return <Loader message={t`Loading mutual followers`} />;
  }

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <ErrorMessage
        className="m-5"
        title={t`Failed to load mutual followers`}
        error={error}
      />

      <div className="divide-y dark:divide-gray-700">
        {profiles?.map((profile, index) => (
          <div className="p-5" key={profile?.id}>
            <UserProfile
              profile={profile as Profile}
              isFollowing={profile?.isFollowedByMe}
              followUnfollowPosition={index + 1}
              followUnfollowSource={FollowUnfollowSource.MUTUAL_FOLLOWERS_MODAL}
              showBio
              showFollow
              showUserPreview={false}
            />
          </div>
        ))}
      </div>
      {hasMore && <span ref={observe} />}
    </div>
  );
};

export default MutualFollowersList;
