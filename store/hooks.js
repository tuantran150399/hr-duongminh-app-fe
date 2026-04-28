/**
 * Custom hooks cho Redux store — import từ đây thay vì react-redux trực tiếp.
 *
 * Ví dụ sử dụng:
 *   import { useAppSelector, useAppDispatch } from '@/store/hooks';
 *   import { selectUser, selectHasPermission } from '@/store/slices/authSlice';
 *
 *   const user = useAppSelector(selectUser);
 *   const canCreateJob = useAppSelector(selectHasPermission('jobs:create'));
 */
export { useDispatch as useAppDispatch, useSelector as useAppSelector } from 'react-redux';
