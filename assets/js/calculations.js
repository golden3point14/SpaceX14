/**
 * @author Wendy Brooks
 * @author May Lynn Forssen
 * @author Alix Joe
 * @author Rachel Macfarlane
 * Created 2015
 */

/*
 * Assumptions:
 *  Tasks array does not contain <idle>
 *  Attribute is numerical
 */
function calculateAverage(tasks, attribute) {
  var sum = 0.0;
  for (var i = 0; i < tasks.length; i++) {
    sum += tasks[i][attribute]
  }
  return sum / tasks.length;
}

/*
 * Assumptions:
 *  Tasks array does not contain <idle>
 *  Attribute is numerical
 *  Mean is the average value of attribute for tasks
 */
function calculateStdDev(tasks, attribute, mean) {
  var sum = 0.0;
  for (var i = 0; i < tasks.length; i++) {
    var diff = mean - tasks[i][attribute];
    sum += diff * diff
  }
  return Math.sqrt(sum / tasks.length);
}
