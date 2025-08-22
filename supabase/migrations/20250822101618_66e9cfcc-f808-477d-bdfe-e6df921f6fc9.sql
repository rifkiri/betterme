-- Phase 1: Clean up phantom assignments created during migration
-- Remove assignments that were automatically created from legacy member_ids but not actual user actions

-- Remove Farah's assignments to Rifki's goals
DELETE FROM goal_assignments 
WHERE user_id = '7f6d0f86-164a-4734-a72c-5dead3d01b3d' 
  AND assigned_by = 'bd2054ee-7ef3-4683-bd13-601a2a21ca1b'
  AND goal_id IN ('79f77383-188e-483d-ada1-60466fabe67c', 'b08f884b-cc19-4a37-85a6-d5eeae093571');

-- Remove Rifki's assignment to Farah's goal  
DELETE FROM goal_assignments 
WHERE user_id = 'bd2054ee-7ef3-4683-bd13-601a2a21ca1b' 
  AND assigned_by = '7f6d0f86-164a-4734-a72c-5dead3d01b3d'
  AND goal_id = '4e6103c7-c4fb-4b87-9a29-ea2d284102d6';