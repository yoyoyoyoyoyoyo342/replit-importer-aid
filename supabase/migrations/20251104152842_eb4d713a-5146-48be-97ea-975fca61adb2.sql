-- Create trigger to automatically update user points when predictions are verified
CREATE TRIGGER update_points_on_verification
  AFTER UPDATE ON weather_predictions
  FOR EACH ROW
  EXECUTE FUNCTION update_prediction_points();